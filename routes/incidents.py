from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.models import Incident, Service

incidents = Blueprint("incidents", __name__)


@incidents.route("/incidents", methods=["GET"])
@jwt_required()
def get_incidents():

    user_id = int(get_jwt_identity())

    user_services = Service.query.filter_by(
        user_id=user_id
    ).all()

    service_ids = [service.id for service in user_services]

    incident_list = Incident.query.filter(
        Incident.service_id.in_(service_ids)
    ).order_by(
        Incident.started_at.desc()
    ).all()

    result = []

    for incident in incident_list:

        result.append({
            "id": incident.id,
            "service": incident.service.name,
            "status": incident.status,
            "failure_reason": incident.failure_reason,
            "started_at": incident.started_at.isoformat(),
            "resolved_at": (
                incident.resolved_at.isoformat()
                if incident.resolved_at else None
            )
        })

    return jsonify(result)