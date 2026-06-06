# Check Error & Style Linter, Complexity Analysis
black:
	flake8 --max-line-length "120" \
		--ignore "B008,N804,N805" \
		--extend-ignore "W503" \
		--exclude "tests,.tox,.mypy_cache,.git,__pycache__" \
		app

# Find unused variables, functions, and methods.
vulture:
	vulture --ignore-decorators "@*_routers.*,@validator,@dataclass,@pydantic.validator,@timer" \
		--exclude "models,schemas,error_code" \
		--min-confidence 20 \
		--ignore-names "cls,case_sensitive,openapi,engine_*" \
		--sort-by-size \
		app

# Check sort imports alphabetically, and automatically separated into sections and by type
isort:
	isort -c -l 120 --diff \
		app

# Check type of Python code
mypy:
	mypy --config-file mypy.ini \
		app

# Check document of code
pydocstyle:
	pydocstyle --match-dir='^(?!tests|const|\.).*' \
		app

# Find security of Container Image
trivy:
	trivy fs --security-checks vuln,config ./

# Find security issues in Python code
bandit:
	bandit -r app

# Check accidental SCM diff checkins, or passwords or secret keys hard coded into files
dodgy:
	dodgy --ignore-paths .venv/

# Find Python dependencies for known security vulnerabilities
safety:
	safety check -r cicd/requirements/requirements.txt


setup:
	pip install virtualenv
	virtualenv .venv
	source .venv/bin/activate
	pip install -r cicd/requirements/requirements-style.txt
	pip install -r cicd/requirements/requirements.txt

test:
	python -m pytest \
		--cov-branch \
		--cov-report term-missing:skip-covered \
		--cov-report xml:coverage-reports/coverage-all.xml \
		--cov=app \
		tests/

init-db:
	cd migration && alembic revision --autogenerate -m "init create database"
	cd ../

migrate:
	cd migration && alembic upgrade head
	cd ../
	
start-celery:
	python3 -m celery -A app.src.tasks worker --loglevel=info