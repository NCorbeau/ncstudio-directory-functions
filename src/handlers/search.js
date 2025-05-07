/**
 * Handler for search API requests
 */
export async function handleSearchRequest(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const directoryId = url.searchParams.get('directory');
      const query = url.searchParams.get('q');
      
      if (!directoryId) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Directory ID is required'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (!query || query.trim() === '') {
        return new Response(JSON.stringify({
          success: true,
          results: []
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Get NocoDB API credentials
      const apiUrl = env.NOCODB_API_URL;
      const apiToken = env.NOCODB_AUTH_TOKEN;
      
      if (!apiUrl || !apiToken) {
        return new Response(JSON.stringify({
          success: false,
          message: 'NocoDB API configuration is missing'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Sanitize the search query
      const sanitizedQuery = sanitizeSearchQuery(query.trim());
      
      // Listings table ID in NocoDB
      const listingsTable = 'mvy1lrp2wr35vo0';
      
      // Create the query condition for NocoDB v2 API
      const queryCondition = `(Directory Identifier,eq,${directoryId})~and((Title,like,%${sanitizedQuery}%)~or(Description,like,%${sanitizedQuery}%)~or(Content,like,%${sanitizedQuery}%))`;
      
      // Fetch from NocoDB
      const response = await fetch(`${apiUrl}/tables/${listingsTable}/records?where=${encodeURIComponent(queryCondition)}`, {
        headers: {
          'xc-token': apiToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Helper function to safely parse JSON
      const safeParseJSON = (str, fallback) => {
        try {
          return str ? JSON.parse(str) : fallback;
        } catch (e) {
          return fallback;
        }
      };
      
      // Process the results
      const results = (data.list || []).map(listing => ({
        slug: `${listing['Directory Identifier']}/${listing.Slug}`,
        data: {
          title: listing.Title,
          description: listing.Description,
          directory: listing['Directory Identifier'],
          category: listing.Category,
          featured: listing.Featured === 1 || listing.Featured === true,
          images: safeParseJSON(listing.Images, []),
          address: listing.Address,
          website: listing.Website,
          phone: listing.Phone,
          rating: listing.Rating,
          tags: safeParseJSON(listing.Tags, []),
          openingHours: safeParseJSON(listing.Opening_Hours, []),
          customFields: safeParseJSON(listing.Custom_Fields, {})
        }
      }));
      
      // Return search results
      return new Response(JSON.stringify({
        success: true,
        results
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=60' // Cache for 60 seconds
        }
      });
    } catch (error) {
      console.error('Error in search API:', error);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Error processing search request',
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  /**
   * Sanitize search query to prevent SQL injection
   */
  function sanitizeSearchQuery(query) {
    if (!query) return '';
    
    // Basic sanitization to remove SQL injection risks
    // Escape % and _ which are SQL wildcards
    let sanitized = query.replace(/%/g, '\\%').replace(/_/g, '\\_');
    
    // Remove any potentially harmful characters
    sanitized = sanitized.replace(/['";]/g, '');
    
    return sanitized;
  }