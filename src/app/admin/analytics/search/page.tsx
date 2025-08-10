'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Search, TrendingUp, AlertTriangle, Users, Download, 
  RefreshCw, AlertCircle, Lightbulb, Filter
} from 'lucide-react';

interface SearchOverview {
  totalSearches: number;
  uniqueSearchers: number;
  avgSearchesPerUser: number;
  noResultsRate: number;
}

interface SearchTerm {
  term: string;
  count: number;
  clickThrough: number;
}

interface NoResultSearch {
  term: string;
  count: number;
}

interface SearchPattern {
  avgSearchLength: number;
  refinementRate: number;
  exitRate: number;
  filterUsage?: {
    campus: number;
    letter: number;
  };
}

interface Recommendation {
  type: 'missing_content' | 'low_clickthrough' | 'popular_path';
  suggestion: string;
}

export default function SearchInsightsPage() {
  const [overview, setOverview] = useState<SearchOverview | null>(null);
  const [topSearchTerms, setTopSearchTerms] = useState<SearchTerm[]>([]);
  const [noResultsSearches, setNoResultsSearches] = useState<NoResultSearch[]>([]);
  const [searchPatterns, setSearchPatterns] = useState<SearchPattern | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchSearchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/search?range=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch search data');
      
      const data = await response.json();
      setOverview(data.overview);
      setTopSearchTerms(data.topSearchTerms);
      setNoResultsSearches(data.noResultsSearches);
      setSearchPatterns(data.searchPatterns);
      setRecommendations(data.recommendations);
      setError(null);
    } catch (err) {
      setError('Failed to load search insights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchData();
  }, [dateRange]); // fetchSearchData is stable, no need to include

  const exportReport = () => {
    const report = {
      overview,
      topSearchTerms,
      noResultsSearches,
      searchPatterns,
      recommendations,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-insights-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading search insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchSearchData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'missing_content':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'low_clickthrough':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'popular_path':
        return <Lightbulb className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Search Insights</h1>
          <p className="text-gray-600 mt-1">Analyze search patterns and improve content discoverability</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={dateRange === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('week')}
            >
              7 Days
            </Button>
            <Button
              variant={dateRange === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('month')}
            >
              30 Days
            </Button>
            <Button
              variant={dateRange === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDateRange('year')}
            >
              1 Year
            </Button>
          </div>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={fetchSearchData} variant="outline" size="sm" aria-label="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.totalSearches.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Search queries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Searchers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.uniqueSearchers.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Individual users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Searches/User</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.avgSearchesPerUser.toFixed(1) || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Per user average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Results Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((overview?.noResultsRate || 0) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Searches with no results</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Top Search Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSearchTerms}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="term" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" name="Searches" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Search Terms Table */}
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Search Term</th>
                    <th className="text-right p-2">Count</th>
                    <th className="text-right p-2">Click-through</th>
                  </tr>
                </thead>
                <tbody>
                  {topSearchTerms.slice(0, 5).map((term) => (
                    <tr key={term.term} className="border-b">
                      <td className="p-2">{term.term}</td>
                      <td className="text-right p-2">{term.count.toLocaleString()}</td>
                      <td className="text-right p-2">
                        <span className={term.clickThrough >= 0.8 ? 'text-green-600' : term.clickThrough >= 0.6 ? 'text-yellow-600' : 'text-red-600'}>
                          {(term.clickThrough * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* No Results Searches */}
        <Card>
          <CardHeader>
            <CardTitle>No Results Searches</CardTitle>
          </CardHeader>
          <CardContent>
            {noResultsSearches.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={noResultsSearches.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="term" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" name="Failed Searches" />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* No Results Table */}
                <div className="mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Search Term</th>
                        <th className="text-right p-2">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {noResultsSearches.slice(0, 5).map((term) => (
                        <tr key={term.term} className="border-b">
                          <td className="p-2">{term.term}</td>
                          <td className="text-right p-2 text-red-600">{term.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No failed searches in this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search Behavior */}
      {searchPatterns && (
        <Card>
          <CardHeader>
            <CardTitle>Search Behavior</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Search Length</p>
                <p className="text-2xl font-bold">{searchPatterns?.avgSearchLength?.toFixed(1) || '0'} words</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Refinement Rate</p>
                <p className="text-2xl font-bold">{(searchPatterns.refinementRate * 100).toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Users who refined their search</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Exit Rate</p>
                <p className="text-2xl font-bold">{(searchPatterns.exitRate * 100).toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Left without clicking results</p>
              </div>
            </div>
            
            {searchPatterns.filterUsage && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Filter Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm">Campus Filter</span>
                    <span className="font-medium">{(searchPatterns.filterUsage.campus * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm">Letter Filter</span>
                    <span className="font-medium">{(searchPatterns.filterUsage.letter * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getRecommendationIcon(rec.type)}
                  <p className="text-sm">{rec.suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}