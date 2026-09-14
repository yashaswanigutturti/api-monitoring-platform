from flask import Flask, render_template
from flask_jwt_extended import JWTManager

from config import Config
from database.db import db
from monitoring.scheduler import start_monitoring
from routes.auth import auth
from routes.services import services
from routes.incidents import incidents


def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)

    db.init_app(app)

    JWTManager(app)

    app.register_blueprint(
        auth,
        url_prefix="/api/auth"
    )

    app.register_blueprint(
        services,
        url_prefix="/api"
    )

    app.register_blueprint(
        incidents,
        url_prefix="/api"
    )

    @app.route("/")
    def dashboard():
        return render_template("dashboard.html")

    @app.route("/login")
    def login_page():
        return render_template("login.html")

    @app.route("/register")
    def register_page():
        return render_template("register.html")

    with app.app_context():
        db.create_all()

    start_monitoring(app)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)