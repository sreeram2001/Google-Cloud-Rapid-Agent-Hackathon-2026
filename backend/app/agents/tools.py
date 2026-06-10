"""MongoDB MCP Server integration for ADK agents."""

import os
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

# MongoDB connection string from environment
MONGODB_URI = os.getenv("MONGODB_URI", "")


def get_mongodb_toolset(read_only: bool = False) -> McpToolset:
    """Create a MongoDB MCP toolset for ADK agents.
    
    This gives agents direct access to MongoDB operations:
    - find, aggregate, count
    - insert-many, update-many, delete-many
    - list-databases, list-collections, collection-schema
    - create-index, etc.
    """
    args = ["-y", "mongodb-mcp-server"]
    if read_only:
        args.append("--readOnly")

    return McpToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command="npx",
                args=args,
                env={
                    "MDB_MCP_CONNECTION_STRING": MONGODB_URI,
                },
            ),
            timeout=30,
        ),
    )


# Read-write toolset (for coding agent saving evaluations, sessions, etc.)
mongodb_tools = get_mongodb_toolset(read_only=False)

# Read-only toolset (for agents that only need to query data)
mongodb_tools_readonly = get_mongodb_toolset(read_only=True)
