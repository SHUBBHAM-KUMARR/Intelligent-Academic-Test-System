from marshmallow import Schema, fields, validate

class AdminSchema(Schema):

    id = fields.Int(dump_only=True)          # here id will be the employee/admin ID

    name = fields.Str(
        required=True,
        validate=validate.Length(min=3)
    )

    email = fields.Email(required=True)

    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8)
    )

    role = fields.Str(
        load_default="admin",
        dump_default="admin",
        validate=validate.OneOf(["admin", "superadmin"])
    )
