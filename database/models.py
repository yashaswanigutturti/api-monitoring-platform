from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    services = db.relationship(
        "Service",
        backref="owner",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    method = db.Column(db.String(10), default="GET")
    status = db.Column(db.String(20), default="UNKNOWN")
    status_code = db.Column(db.Integer, nullable=True)
    response_time = db.Column(db.Float, nullable=True)
    last_checked = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    results = db.relationship(
        "MonitorResult",
        backref="service",
        lazy=True,
        cascade="all, delete-orphan"
    )

    incidents = db.relationship(
        "Incident",
        backref="service",
        lazy=True,
        cascade="all, delete-orphan"
    )


class MonitorResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), nullable=False)
    status_code = db.Column(db.Integer, nullable=True)
    response_time = db.Column(db.Float, nullable=True)
    error_message = db.Column(db.String(500), nullable=True)
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)

    service_id = db.Column(
        db.Integer,
        db.ForeignKey("service.id"),
        nullable=False
    )


class Incident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default="OPEN")
    failure_reason = db.Column(db.String(500))
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    service_id = db.Column(
        db.Integer,
        db.ForeignKey("service.id"),
        nullable=False
    )