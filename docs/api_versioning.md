# API Versioning Strategy

This document outlines the API versioning strategy for the AI-Powered Smart Task Manager.

## Overview

API versioning ensures that client applications can continue to work with the API even as it evolves. Our strategy uses URL-based versioning with the format `/api/v{version_number}` (e.g., `/api/v1`).

## Implementation Details

### URL Structure

- All API endpoints are versioned with a prefix: `/api/v1/`, `/api/v2/`, etc.
- Legacy, non-versioned endpoints (`/api/*`) are maintained for backward compatibility but will be deprecated in future releases.

### Version Headers

Every API response includes an `X-API-Version` header that indicates which version of the API was used to fulfill the request.

### Client Usage

Clients should specify the API version in their requests by using the appropriate URL prefix. For example:

```
GET /api/v1/tasks
```

### Frontend Configuration

The frontend application uses an environment variable to determine which API version to use:

- `REACT_APP_API_VERSION`: Specifies the API version to use (defaults to `v1`)

## Versioning Guidelines

### When to Create a New API Version

Create a new API version when making breaking changes, such as:

1. Changing the structure of request or response payloads
2. Removing fields that clients may depend on
3. Changing the semantics of existing fields
4. Changing endpoint paths

### Backward Compatibility

Each API version should continue to function indefinitely, though older versions may be deprecated. When a version is deprecated:

1. Documentation should clearly indicate the deprecation status
2. Responses should include a `Deprecation` header
3. A migration path to the newer version should be provided

### Creating a New Version

To create a new API version:

1. Use the `create_api_version()` utility function in `app/core/versioning.py`
2. Copy and modify existing route handlers in a new module
3. Register the new routes with the versioned router

## Example

```python
# Creating a new API version
from app.core.versioning import create_api_version

# Create v2 router
v2_router = create_api_version("v2")

# Add routes to v2
v2_router.include_router(users_v2.router, tags=["users"])
```

## Client Migration

When migrating clients to a new API version:

1. Update the `REACT_APP_API_VERSION` environment variable
2. Test thoroughly to ensure compatibility
3. Update any client-side models or parsing to handle new response formats
