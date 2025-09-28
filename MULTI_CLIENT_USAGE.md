# Multi-Client Google Docs MCP Server Usage

This document explains how to use the new multi-client functionality in the Google Docs MCP Server.

## Overview

The server now supports multiple Google client credentials, allowing you to:
- Create multiple client credentials files
- Switch between different Google accounts
- Set workflow-level default credentials
- Use specific credentials for individual API calls

## Environment Variables

- `GOOGLE_CREDENTIALS_DIR`: Directory where client credentials are stored (default: `./credentials/`)
- `CURRENT_WORKFLOW_CREDENTIALS`: Current workflow's default credentials file (set automatically)

## Basic Usage

### 1. Create Your First Client

```bash
# This will create a new client with a unique UUID name
createNewGoogleClient

# Or create with a specific name
createNewGoogleClient --clientName "my-work-account"
```

### 2. List Available Clients

```bash
listGoogleClients
```

### 3. Set Workflow Default Credentials

```bash
# Set default credentials for the current workflow
setWorkflowCredentials --credentialsFileName "my-work-account"
```

### 4. Use Tools with Specific Credentials

```bash
# Use specific credentials for a single call
readGoogleDoc --documentId "your-doc-id" --credentialsFileName "my-work-account"

# Use workflow default credentials (if set)
readGoogleDoc --documentId "your-doc-id"

# Use default client (if no workflow credentials set)
readGoogleDoc --documentId "your-doc-id"
```

## File Structure

```
project-root/
├── credentials.json                    # Default credentials (required for initial setup)
├── credentials/                        # Client credentials directory
│   ├── client_12345.credentials.json  # Client credentials file
│   ├── client_12345.token.json        # Client token file
│   ├── my-work-account.credentials.json
│   └── my-work-account.token.json
└── ...
```

## Workflow Example

```bash
# 1. Create clients for different accounts
createNewGoogleClient --clientName "work-account"
createNewGoogleClient --clientName "personal-account"

# 2. Set work account as default for this workflow
setWorkflowCredentials --credentialsFileName "work-account"

# 3. All subsequent calls use work account
readGoogleDoc --documentId "work-doc-id"
listGoogleDocs

# 4. Override for specific call to personal account
readGoogleDoc --documentId "personal-doc-id" --credentialsFileName "personal-account"

# 5. Check current workflow credentials
getWorkflowCredentials
```

## Available Tools

### Client Management
- `createNewGoogleClient`: Create a new client with unique credentials
- `listGoogleClients`: List all available client credentials
- `setWorkflowCredentials`: Set default credentials for current workflow
- `getWorkflowCredentials`: Get current workflow credentials

### Document Operations (all support credentialsFileName parameter)
- `readGoogleDoc`
- `appendToGoogleDoc`
- `insertText`
- `deleteRange`
- `applyTextStyle`
- `applyParagraphStyle`
- `insertTable`
- `insertPageBreak`
- `fixListFormatting`

### Drive Operations (all support credentialsFileName parameter)
- `listGoogleDocs`
- `searchGoogleDocs`
- `getRecentGoogleDocs`
- `getDocumentInfo`
- `createFolder`
- `listFolderContents`
- `getFolderInfo`
- `moveFile`
- `copyFile`
- `renameFile`
- `deleteFile`
- `createDocument`
- `createFromTemplate`

### Comment Operations (all support credentialsFileName parameter)
- `listComments`
- `getComment`
- `addComment`
- `replyToComment`
- `resolveComment`
- `deleteComment`

## Migration from Single Client

If you're upgrading from the single-client version:

1. Your existing `credentials.json` and `token.json` files will continue to work as the default client
2. Use `createNewGoogleClient` to create additional clients
3. Optionally use `setWorkflowCredentials` to set a default for your workflow
4. Add `credentialsFileName` parameter to individual tool calls as needed

## Security Notes

- Credentials files contain sensitive information and should be kept secure
- Each client has its own token file for authentication
- The credentials directory should be added to `.gitignore` if using version control
- Consider using environment variables for the credentials directory path in production
