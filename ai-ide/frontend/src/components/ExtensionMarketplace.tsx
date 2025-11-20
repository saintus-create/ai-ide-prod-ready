/**
 * Extension Marketplace Component
 * Browse, search, and install extensions from the marketplace
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Star, User, Calendar, Tag, Shield, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Extension } from '../types/extension';

interface ExtensionMarketplaceProps {
  onInstallExtension?: (extension: Extension) => void;
  onClose?: () => void;
  installedExtensions?: Set<string>;
}

interface MarketplaceExtension {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: {
    name: string;
    url?: string;
  };
  categories: string[];
  keywords: string[];
  downloadCount: number;
  rating: number;
  ratingCount: number;
  icon?: string;
  screenshots?: string[];
  lastUpdated: Date;
  size: string;
  license: string;
  repository?: string;
  homepage?: string;
  ratingStars: number[];
  verified: boolean;
  featured: boolean;
}

interface MarketplaceFilters {
  category: string;
  rating: number;
  verified: boolean;
  featured: boolean;
  searchQuery: string;
}

const CATEGORIES = [
  'All',
  'Productivity',
  'Themes',
  'Language Support',
  'Debugging',
  'Git',
  'AI Tools',
  'Integration',
  'Utility',
  'Snippets',
  'Other'
];

// Mock extension data for demonstration
const MOCK_EXTENSIONS: MarketplaceExtension[] = [
  {
    id: 'hello-world',
    name: 'hello-world',
    displayName: 'Hello World Extension',
    version: '1.0.0',
    description: 'A simple hello world extension that demonstrates the extension API. Perfect for developers getting started with the AI-IDE extension system.',
    author: { name: 'AI-IDE Team', url: 'https://github.com/ai-ide' },
    categories: ['Utility', 'Example'],
    keywords: ['example', 'hello world', 'tutorial'],
    downloadCount: 1234,
    rating: 4.5,
    ratingCount: 87,
    lastUpdated: new Date('2024-12-01'),
    size: '45 KB',
    license: 'MIT',
    ratingStars: [5, 4, 4, 4, 4],
    verified: true,
    featured: true
  },
  {
    id: 'custom-theme',
    name: 'custom-theme',
    displayName: 'Custom Theme Pack',
    version: '2.1.0',
    description: 'A collection of beautiful custom themes for the AI-IDE. Includes dark, light, and colorful themes with syntax highlighting.',
    author: { name: 'Theme Creator', url: 'https://github.com/theme-creator' },
    categories: ['Themes', 'Productivity'],
    keywords: ['theme', 'color', 'dark', 'light', 'syntax'],
    downloadCount: 5678,
    rating: 4.8,
    ratingCount: 234,
    lastUpdated: new Date('2024-11-28'),
    size: '156 KB',
    license: 'Apache-2.0',
    ratingStars: [5, 5, 5, 4, 5],
    verified: true,
    featured: true
  },
  {
    id: 'git-enhancer',
    name: 'git-enhancer',
    displayName: 'Git Enhancer',
    version: '1.5.2',
    description: 'Enhanced Git integration with advanced diff visualization, merge conflict resolution, and branch management tools.',
    author: { name: 'Git Tools Inc.', url: 'https://github.com/git-tools' },
    categories: ['Git', 'Productivity'],
    keywords: ['git', 'version control', 'branch', 'merge', 'diff'],
    downloadCount: 3421,
    rating: 4.3,
    ratingCount: 156,
    lastUpdated: new Date('2024-11-30'),
    size: '89 KB',
    license: 'MIT',
    ratingStars: [5, 4, 4, 4, 3],
    verified: true,
    featured: false
  },
  {
    id: 'ai-assistant',
    name: 'ai-assistant',
    displayName: 'AI Assistant Pro',
    version: '3.0.0',
    description: 'Advanced AI assistant with code completion, refactoring suggestions, and intelligent debugging support.',
    author: { name: 'AI Solutions', url: 'https://github.com/ai-solutions' },
    categories: ['AI Tools', 'Productivity'],
    keywords: ['ai', 'completion', 'refactoring', 'debugging', 'intelligence'],
    downloadCount: 8901,
    rating: 4.7,
    ratingCount: 445,
    lastUpdated: new Date('2024-12-02'),
    size: '234 KB',
    license: 'Commercial',
    ratingStars: [5, 5, 4, 5, 4],
    verified: true,
    featured: true
  },
  {
    id: 'python-linter',
    name: 'python-linter',
    displayName: 'Python Advanced Linter',
    version: '1.2.0',
    description: 'Comprehensive Python linting with PEP 8 compliance, type checking, and advanced static analysis.',
    author: { name: 'Python Tools', url: 'https://github.com/python-tools' },
    categories: ['Language Support', 'Utility'],
    keywords: ['python', 'linting', 'pep8', 'type checking', 'static analysis'],
    downloadCount: 2345,
    rating: 4.6,
    ratingCount: 123,
    lastUpdated: new Date('2024-11-25'),
    size: '78 KB',
    license: 'MIT',
    ratingStars: [5, 4, 5, 4, 4],
    verified: true,
    featured: false
  }
];

export const ExtensionMarketplace: React.FC<ExtensionMarketplaceProps> = ({
  onInstallExtension,
  onClose,
  installedExtensions = new Set()
}) => {
  const [extensions, setExtensions] = useState<MarketplaceExtension[]>(MOCK_EXTENSIONS);
  const [filteredExtensions, setFilteredExtensions] = useState<MarketplaceExtension[]>(MOCK_EXTENSIONS);
  const [loading, setLoading] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [selectedExtension, setSelectedExtension] = useState<MarketplaceExtension | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: 'All',
    rating: 0,
    verified: false,
    featured: false,
    searchQuery: ''
  });

  // Filter extensions based on current filters
  useEffect(() => {
    let filtered = extensions;

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(ext =>
        ext.displayName.toLowerCase().includes(query) ||
        ext.description.toLowerCase().includes(query) ||
        ext.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
        ext.author.name.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (filters.category !== 'All') {
      filtered = filtered.filter(ext =>
        ext.categories.some(cat => cat.toLowerCase() === filters.category.toLowerCase())
      );
    }

    // Filter by rating
    if (filters.rating > 0) {
      filtered = filtered.filter(ext => ext.rating >= filters.rating);
    }

    // Filter by verified
    if (filters.verified) {
      filtered = filtered.filter(ext => ext.verified);
    }

    // Filter by featured
    if (filters.featured) {
      filtered = filtered.filter(ext => ext.featured);
    }

    // Sort by featured first, then by rating, then by download count
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.rating !== b.rating) return b.rating - a.rating;
      return b.downloadCount - a.downloadCount;
    });

    setFilteredExtensions(filtered);
  }, [extensions, filters]);

  // Handle install extension
  const handleInstall = useCallback(async (extension: MarketplaceExtension) => {
    setInstallingId(extension.id);
    
    try {
      // Simulate installation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call install callback
      if (onInstallExtension) {
        const installExtension: Extension = {
          id: extension.id,
          name: extension.name,
          manifest: {
            name: extension.name,
            displayName: extension.displayName,
            version: extension.version,
            description: extension.description,
            author: extension.author,
            main: `dist/${extension.name}.js`,
            permissions: ['workspace.read', 'ui.render'],
            categories: extension.categories.map(cat => cat.toLowerCase().replace(' ', '-')) as any[],
            keywords: extension.keywords,
            homepage: extension.homepage,
            repository: extension.repository,
            license: extension.license
          },
          state: 'active' as const,
          installedAt: new Date(),
          config: {}
        };
        
        onInstallExtension(installExtension);
      }
    } catch (error) {
      console.error('Failed to install extension:', error);
    } finally {
      setInstallingId(null);
    }
  }, [onInstallExtension]);

  // Render star rating
  const renderStarRating = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    const starClass = 'text-yellow-400';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className={`${starSize} ${starClass} fill-current`} />
      );
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className={`${starSize} text-gray-300`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${starSize} ${starClass} fill-current`} />
          </div>
        </div>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className={`${starSize} text-gray-300`} />
      );
    }
    
    return stars;
  };

  // Render extension card
  const renderExtensionCard = (extension: MarketplaceExtension) => {
    const isInstalled = installedExtensions.has(extension.name);
    const isInstalling = installingId === extension.id;

    return (
      <div key={extension.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {extension.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium">{extension.displayName}</h3>
                {extension.verified && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
                {extension.featured && (
                  <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded">
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <User className="w-3 h-3" />
                <span>{extension.author.name}</span>
                <span>•</span>
                <span>v{extension.version}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {renderStarRating(extension.rating)}
            <span className="text-xs text-gray-400 ml-1">({extension.ratingCount})</span>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
          {extension.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {extension.categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
            >
              {category}
            </span>
          ))}
          {extension.categories.length > 3 && (
            <span className="text-xs text-gray-400">
              +{extension.categories.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span className="flex items-center space-x-1">
              <Download className="w-3 h-3" />
              <span>{extension.downloadCount.toLocaleString()}</span>
            </span>
            <span>{extension.size}</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{extension.lastUpdated.toLocaleDateString()}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedExtension(extension);
                setShowDetails(true);
              }}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Details
            </button>
            
            {isInstalled ? (
              <span className="text-green-400 text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Installed
              </span>
            ) : (
              <button
                onClick={() => handleInstall(extension)}
                disabled={isInstalling}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium px-3 py-1 rounded flex items-center space-x-1 transition-colors"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Installing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Install</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render extension details modal
  const renderExtensionDetails = () => {
    if (!showDetails || !selectedExtension) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedExtension.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl text-white font-bold">{selectedExtension.displayName}</h2>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <span>by {selectedExtension.author.name}</span>
                    {selectedExtension.verified && (
                      <>
                        <span>•</span>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Verified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-1">
                {renderStarRating(selectedExtension.rating, 'lg')}
                <span className="text-white ml-2">{selectedExtension.rating}</span>
                <span className="text-gray-400">({selectedExtension.ratingCount} reviews)</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">{selectedExtension.downloadCount.toLocaleString()} downloads</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">{selectedExtension.size}</span>
            </div>

            <div className="mb-6">
              <h3 className="text-white font-medium mb-2">Description</h3>
              <p className="text-gray-300">{selectedExtension.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-white font-medium mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {selectedExtension.categories.map((category) => (
                  <span
                    key={category}
                    className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-white font-medium mb-2">Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Version:</span>
                  <span className="text-white ml-2">{selectedExtension.version}</span>
                </div>
                <div>
                  <span className="text-gray-400">License:</span>
                  <span className="text-white ml-2">{selectedExtension.license}</span>
                </div>
                <div>
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-white ml-2">{selectedExtension.lastUpdated.toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Keywords:</span>
                  <span className="text-white ml-2">{selectedExtension.keywords.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-4">
                {selectedExtension.repository && (
                  <a
                    href={selectedExtension.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Repository</span>
                  </a>
                )}
                {selectedExtension.homepage && (
                  <a
                    href={selectedExtension.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Homepage</span>
                  </a>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Close
                </button>
                
                {installedExtensions.has(selectedExtension.name) ? (
                  <span className="text-green-400 font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Installed
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      handleInstall(selectedExtension);
                      setShowDetails(false);
                    }}
                    disabled={installingId === selectedExtension.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2"
                  >
                    {installingId === selectedExtension.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Installing...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Install</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl text-white font-bold">Extension Marketplace</h1>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search extensions..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Rating Filter */}
            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value={0}>Any Rating</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
              <option value={4.8}>4.8+ Stars</option>
            </select>

            {/* Verified Filter */}
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
              />
              <span>Verified only</span>
            </label>

            {/* Featured Filter */}
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
              />
              <span>Featured only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            {filteredExtensions.length} extension{filteredExtensions.length !== 1 ? 's' : ''} found
          </span>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none">
              <option>Most Popular</option>
              <option>Highest Rated</option>
              <option>Recently Updated</option>
              <option>Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Extension Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredExtensions.map(renderExtensionCard)}
        </div>

        {/* No Results */}
        {filteredExtensions.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">No extensions found</h3>
            <p className="text-gray-400">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

      {/* Extension Details Modal */}
      {renderExtensionDetails()}
    </div>
  );
};

export default ExtensionMarketplace;