'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  Code,
  X,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  campus?: string;
  includeInactive?: boolean;
}

export default function ImportExportClient() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    campus: '',
    includeInactive: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/json'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error('Please select a CSV or JSON file');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setImportFile(file);
    setImportResult(null);
    toast.success('File selected successfully');

    // Generate preview
    try {
      await generatePreview(file);
    } catch (error) {
      toast.error('Failed to preview file');
      console.error('Preview error:', error);
    }
  };

  const generatePreview = async (file: File) => {
    const text = await file.text();
    let data: any[] = [];

    try {
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        data = Array.isArray(parsed) ? parsed.slice(0, 5) : [parsed];
      } else {
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('CSV must have headers and at least one data row');
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      }
      setPreviewData(data);
    } catch (error) {
      setPreviewData(null);
      console.error('Preview generation failed:', error);
    }
  };

  const validateImportData = (data: any[]): string[] => {
    const errors: string[] = [];
    const requiredFields = ['title', 'url', 'letter', 'campus'];

    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field] || !item[field].toString().trim()) {
          errors.push(`Row ${index + 1}: Missing ${field}`);
        }
      });

      // Validate URL format
      if (item.url) {
        try {
          new URL(item.url);
        } catch {
          errors.push(`Row ${index + 1}: Invalid URL format`);
        }
      }

      // Validate letter is single character
      if (item.letter && item.letter.length !== 1) {
        errors.push(`Row ${index + 1}: Letter must be a single character`);
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await importFile.text();
      let data: any[] = [];

      // Parse file based on type
      if (importFile.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        data = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error('CSV must have headers and at least one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      }

      // Validate data
      const validationErrors = validateImportData(data);
      if (validationErrors.length > 0) {
        setImportResult({
          success: false,
          imported: 0,
          errors: validationErrors,
          warnings: []
        });
        return;
      }

      // Import process - create each item using the API
      let imported = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < data.length; i++) {
        try {
          const response = await fetch('/api/indexItems', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data[i])
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Import failed');
          }

          imported++;
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Import failed'}`);
        }
      }

      setImportResult({
        success: errors.length === 0,
        imported,
        errors,
        warnings
      });

      if (errors.length === 0) {
        toast.success(`Successfully imported ${imported} items`);
      } else {
        toast.error(`Import completed with ${errors.length} errors`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setImportResult({
        success: false,
        imported: 0,
        errors: [errorMessage],
        warnings: []
      });
      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);

    try {
      // Simulate API call to get data
      const response = await fetch('/api/indexItems' + (options.campus ? `?campus=${encodeURIComponent(options.campus)}` : ''));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      const items = Array.isArray(data) ? data : [];
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = `index-items-export-${timestamp}`;
      let content = '';
      let mimeType = '';

      switch (options.format) {
        case 'csv':
          filename += '.csv';
          mimeType = 'text/csv';
          content = [
            'ID,Title,Letter,Campus,URL,Created At',
            ...items.map((item: any) => 
              `${item.id},"${item.title}",${item.letter},"${item.campus}","${item.url}","${item.createdAt}"`
            )
          ].join('\n');
          break;

        case 'json':
          filename += '.json';
          mimeType = 'application/json';
          content = JSON.stringify(items, null, 2);
          break;

        case 'xlsx':
          // For now, export as CSV with xlsx extension
          filename += '.xlsx';
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          content = [
            'ID,Title,Letter,Campus,URL,Created At',
            ...items.map((item: any) => 
              `${item.id},"${item.title}",${item.letter},"${item.campus}","${item.url}","${item.createdAt}"`
            )
          ].join('\n');
          break;
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${items.length} items successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      toast.error(errorMessage);
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `import-template-${timestamp}`;
    let content = '';
    let mimeType = '';

    if (format === 'csv') {
      filename += '.csv';
      mimeType = 'text/csv';
      content = 'title,url,letter,campus\n"Sample Title","https://example.com","A","College of San Mateo"';
    } else {
      filename += '.json';
      mimeType = 'application/json';
      content = JSON.stringify([
        {
          title: "Sample Title",
          url: "https://example.com",
          letter: "A",
          campus: "College of San Mateo"
        }
      ], null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success(`Downloaded ${format.toUpperCase()} template`);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select File (CSV or JSON)</Label>
            <div className="mt-2">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="cursor-pointer"
              />
            </div>
          </div>

          {importFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{importFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(importFile.size / 1024).toFixed(1)} KB)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImportFile(null);
                    setPreviewData(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {previewData && (
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Data Preview (first 5 rows)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showPreview && (
                <div className="mt-2 max-h-40 overflow-auto bg-gray-50 border rounded p-3">
                  <pre className="text-xs">{JSON.stringify(previewData, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!importFile || isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </>
            )}
          </Button>

          {/* Import Result */}
          {importResult && (
            <div className={`border rounded-lg p-4 ${
              importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {importResult.success ? 'Import Successful' : 'Import Failed'}
                </span>
              </div>
              <p className="text-sm mb-2">
                Imported: {importResult.imported} items
              </p>
              {importResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                  <ul className="text-xs text-red-600 space-y-1 max-h-20 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Download Templates</Label>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('csv')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('json')}>
                <Code className="mr-2 h-4 w-4" />
                JSON Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campus-filter">Filter by Campus (optional)</Label>
            <select 
              id="campus-filter"
              value={exportOptions.campus}
              className="mt-1 w-full px-3 py-2 border border-input rounded-md text-sm"
              onChange={(e) => {
                setExportOptions(prev => ({ ...prev, campus: e.target.value }));
              }}
            >
              <option value="">All Campuses</option>
              <option value="College of San Mateo">College of San Mateo</option>
              <option value="Skyline College">Skyline College</option>
              <option value="Cañada College">Cañada College</option>
              <option value="District Office">District Office</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Export Format</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport({ ...exportOptions, format: 'csv' })}
                disabled={isExporting}
                className="flex-col h-auto py-3"
              >
                <FileSpreadsheet className="h-6 w-6 mb-1" />
                <span className="text-xs">CSV</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport({ ...exportOptions, format: 'json' })}
                disabled={isExporting}
                className="flex-col h-auto py-3"
              >
                <Code className="h-6 w-6 mb-1" />
                <span className="text-xs">JSON</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport({ ...exportOptions, format: 'xlsx' })}
                disabled={isExporting}
                className="flex-col h-auto py-3"
              >
                <FileText className="h-6 w-6 mb-1" />
                <span className="text-xs">Excel</span>
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Export Information</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>CSV:</strong> Comma-separated values, opens in Excel</li>
              <li>• <strong>JSON:</strong> Machine-readable format for APIs</li>
              <li>• <strong>Excel:</strong> Native Excel format with formatting</li>
              {exportOptions.campus && (
                <li className="text-blue-700 font-medium">• Filtered by: {exportOptions.campus}</li>
              )}
              {!exportOptions.campus && (
                <li>• All campuses will be included</li>
              )}
            </ul>
          </div>

          {isExporting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing export...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}