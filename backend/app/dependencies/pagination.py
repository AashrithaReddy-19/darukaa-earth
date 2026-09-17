"""Reusable, optional skip/limit query params for list endpoints.

The API contract does not mandate pagination for list endpoints (it returns
`{"items": [...], "total": N}` with no page params), but exposing optional
`skip`/`limit` query params is backwards compatible -- clients that omit them
get every matching row (up to a generous default limit), while a frontend that
does want pagination later can opt in without a breaking change.
"""

from fastapi import Query


def pagination_params(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=1000),
) -> dict[str, int]:
    return {"skip": skip, "limit": limit}
