const directoriesTableId = "m823s0ww0l4mekb";
const listingsTableId = "mvy1lrp2wr35vo0";
const landingPagesTableId = "mbrnluso1gxfwd4";

/**
 * Handler for directory webhook requests from NocoDB
 */
export async function handleDirectoryWebhook(request, env, ctx) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    console.log("Received webhook payload:", JSON.stringify(payload, null, 2));

    // Extract the affected directory
    const directoryId = extractDirectoryFromPayload(payload);

    if (!directoryId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Could not determine directory from payload",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Identified directory: ${directoryId}`);

    // Get Cloudflare API credentials
    const apiToken = env.CF_API_TOKEN;
    const accountId = env.CF_ACCOUNT_ID;

    if (!apiToken || !accountId) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Missing Cloudflare API credentials in environment variables",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the project name for this directory
    // The naming convention is directory-[directoryId]
    const projectName = `ncstudio-directory-${directoryId}`;

    // Trigger the build
    const buildResult = await triggerPagesBuild(
      apiToken,
      accountId,
      projectName
    );

    if (!buildResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to trigger build for ${projectName}`,
          error: buildResult.error,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Build triggered for ${projectName}`,
        deploymentId: buildResult.deploymentId,
        directory: directoryId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Error processing webhook",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Extract the directory from the webhook payload
 */
function extractDirectoryFromPayload(payload) {
  if (payload.table === directoriesTableId) {
    return getDirectoryIdentifierFromPayload(payload, "Identifier");
  } else if (payload.table === listingsTableId) {
    return getDirectoryIdentifierFromPayload(payload, "Directory Identifier");
  } else if (payload.table === landingPagesTableId) {
    return getDirectoryIdentifierFromPayload(payload, "Directory Identifier");
  }

  return getDirectoryIdentifierFromPayload(payload);
}

/**
 * Trigger a build for a Cloudflare Pages project
 */
async function triggerPagesBuild(apiToken, accountId, projectName) {
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        production: { enabled: true },
      }),
    });

    const result = await response.json();

    if (!result.success) {
      console.error("Cloudflare API error:", result.errors);
      return {
        success: false,
        error: result.errors || "Unknown error from Cloudflare API",
      };
    }

    return {
      success: true,
      deploymentId: result.result?.id || "unknown",
    };
  } catch (error) {
    console.error("Error triggering Pages build:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function getDirectoryIdentifierFromPayload(
  payload,
  fieldName = "Directory Identifier"
) {
  // Check if the payload contains a directory identifier
  if (payload.data && payload.data.rows && payload.data.rows[0][fieldName]) {
    return payload.data.rows[0][fieldName];
  }

  // If not found, return null
  return null;
}
