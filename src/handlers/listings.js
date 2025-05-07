/**
 * Handler for listings API requests
 */
export async function handleListingsRequest(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const directoryId = url.searchParams.get('directory');
      
      if (!directoryId) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Directory ID is required'
        }), {
          status: 400,
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
      
      // Listings table ID in NocoDB
      const listingsTable = 'mvy1lrp2wr35vo0';
      
      // Fetch listings from NocoDB
      const response = await fetch(
        `${apiUrl}/tables/${listingsTable}/records?where=(Directory%20Identifier,eq,${directoryId})`,
        {
          headers: {
            'xc-token': apiToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
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
      
      // Transform the listings data
      const transformedListings = (data.list || []).map(listing => ({
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
          customFields: safeParseJSON(listing.Custom_Fields, {}),
          updatedAt: listing.UpdatedAt
        }
      }));
      
      // Return the listings data
      return new Response(JSON.stringify({
        success: true,
        data: transformedListings
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=300' // Cache for 5 minutes
        }
      });
    } catch (error) {
      console.error('Error in listings API:', error);
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Error processing listings request',
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }