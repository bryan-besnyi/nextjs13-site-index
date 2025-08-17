/**
 * Centralized Type System for Next.js 13 Site Index Application
 * 
 * This file serves as the main entry point for all types used throughout the application.
 * It re-exports types from domain-specific modules for easy importing.
 */

// Core domain types
export * from './api';
export * from './admin';
export * from './auth';
export * from './forms';
export * from './performance';
export * from './ui';

// Core IndexItem and related types
export interface IndexItem {
  id: number;
  title: string;
  letter: string;
  campus: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}

// IndexItem for search results
export interface SearchResultType extends IndexItem {}

// Campus configuration
export const VALID_CAMPUSES = [
  'College of San Mateo',
  'Skyline College', 
  'Cañada College',
  'District Office'
] as const;

export type Campus = typeof VALID_CAMPUSES[number];

// Letter configuration
export const VALID_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export type Letter = typeof VALID_LETTERS[number];

// Campus info for forms
export interface CampusInfo {
  id: string;
  value: Campus;
}

// Query filters
export interface IndexItemFilters {
  campus?: Campus;
  letter?: Letter;
  search?: string;
}

// Database response types
export interface IndexItemResponse {
  indexItems?: IndexItem[];
  indexItem?: IndexItem | null;
  newIndexItem?: IndexItem;
  updatedItem?: IndexItem;
  deletedItem?: IndexItem;
  results?: IndexItem[];
  error?: any;
}