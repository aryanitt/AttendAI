from bson import ObjectId
from bson.errors import InvalidId


def oid_str(v) -> str:
    return str(v) if isinstance(v, ObjectId) else str(v)


def parse_oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except InvalidId as e:
        raise ValueError("Invalid id") from e


def serialize_doc(doc: dict | None, *, id_key: str = "id") -> dict | None:
    if doc is None:
        return None
    out: dict = {}
    for k, v in doc.items():
        if k in ("password", "password_hash"):
            continue
        if k == "_id":
            out[id_key] = str(v)
        elif isinstance(v, ObjectId):
            out[k] = str(v)
        else:
            out[k] = v
    return out


def serialize_list(items: list) -> list:
    return [serialize_doc(x) for x in items if x is not None]
