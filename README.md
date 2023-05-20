
<h1 align="center">
  <br>
 <a href="https://imgbb.com/"><img src="https://i.ibb.co/Q7VtNcD/blitz-removebg-preview.png" alt="blitz-removebg-preview" width=100 border="0"></a>
  <br>
  blitz
  <br>
</h1>

<h4 align="center">A simple load testing application built in Django.</h4>

<p align="center">
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>


## Key Features
-  Measure response time, throughput, error rate, and latency of your APIs.
- Measure network usage of your APIs during load testing to identify potential bottlenecks.
- Analyze HTTP response code distribution to identify areas for improvement in API functionality.
- Track average, median, maximum and minimum response times for a more comprehensive understanding of API performance.
- Monitor your CPU and memory usage while performing load tests.

## How To Use

### Initial setup
To clone and run this application, you'll need [Git](https://git-scm.com) , [Python 3](https://www.python.org/downloads/) and [virtualenv](https://pypi.org/project/virtualenv/) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone git@github.com:michael-awe/app-load-testing-ag.git

# Go into the repository
$ cd app-load-testing-ag

# Install dependencies
$ python3 -m venv env
$ source env/bin/activate
$ pip install -r requirements.txt
$ python manage.py makemigrations && python manage.py migrate

```

### Running the application
```bash
# Run the app
$ python manage.py runserver
```
Navigate to https://127.0.0.1:8000 in your browser to use the app

## Credits

This software uses the following open source packages:

- [Django](https://www.djangoproject.com/)
- [Chart.js](https://www.chartjs.org/)

## License

This project is licensed under the **MIT License**, which grants users the freedom to modify, distribute, and use the code for both personal and commercial purposes.

---

> GitHub [@michael-awe](https://github.com/michaelawe) &nbsp;&middot;&nbsp;
> Twitter [@itsmichaelawe](https://twitter.com/itsmichaelawe)

