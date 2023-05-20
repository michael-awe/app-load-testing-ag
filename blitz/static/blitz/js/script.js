runLoadTest()

//gets CSRF token from cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

//sends POST request to run load test   
function runLoadTest(){

    button = document.querySelector('#run-load-test')
    console.log(button)
    button.addEventListener('click', function(e){
        e.preventDefault();
        resultscontainer = document.querySelector('.results');
        resultscontainer.style.display = 'none';

        // Get the CSRF token from the cookie
        const csrftoken = getCookie('csrftoken');
        num_requests = document.querySelector('#num_requests').value;
        url = document.querySelector('#url').value;

        const formData = new FormData();
        formData.append("num_requests", num_requests);
        formData.append("url", url);

        
        this.disabled = true;
        this.innerHTML = '<div class="lds-circle"><div></div></div>Run load test'

        fetch("/run", {
            method: "POST",
            body: formData,
            headers: {
                "X-CSRFToken": csrftoken,
            }
          }).then(response => response.json()).then(data =>{
            
            setTimeout(() => {
                this.innerHTML = '-> Run load test'
            }, 1000);

            if (data.error){
                alert(data.error);
                this.disabled = false;
                return;
            }
            displayResults(data);
            this.disabled = false;
            

          }).catch(error => {
            
          });

    });

}

//displays result graphs
function displayResults(data){
    var inc = 1;
    console.log('displaying results')
    
    //main container
    container = document.querySelector('.results');
    container.style.display = 'flex';

    //fills in statistics
    document.querySelector('#duration').innerHTML = data.duration;
    document.querySelector('#number_of_requests').innerHTML = data.num_requests;
    document.querySelector('#avg_latency').innerHTML = data.average_latency;
    document.querySelector('#cpu').innerHTML = data.average_cpu_usage;
    document.querySelector('#memory').innerHTML = data.average_memory_usage;
    document.querySelector('#rps').innerHTML = data.throughput;
    document.querySelector('#num_successful').innerHTML = data.num_success;
    document.querySelector('#num_failed').innerHTML = data.num_failed;
    document.querySelector('#min_response_time').innerHTML = data.min_response_time;
    document.querySelector('#max_response_time').innerHTML = data.max_response_time;
    document.querySelector('#median_response_time').innerHTML = data.median_response_time;
    document.querySelector('#avg_response_time').innerHTML = data.average_response_time;

    //select graphs
    memory_graph = document.querySelector('#memory_graph').getContext('2d');
    cpu_graph = document.querySelector('#cpu_graph').getContext('2d');
    active_threads_graph = document.querySelector('#active_threads_graph').getContext('2d');
    response_time_graph = document.querySelector('#response_time_graph').getContext('2d');
    network_graph = document.querySelector('#network_graph').getContext('2d');


    //graph config
    var options = {
        responsive: true,
        scales: {
            x: {
                grid: {
                  display: false
                }
              },
              y: {
                grid: {
                  display: false
                }
            }
        }
    }

    //memory graph
    num_memory_points = data.memory_usage.length;
    interval = data.duration / num_memory_points;
    let memory_labels = [];
    let memory_data = [];
    if (num_memory_points > 100){
        inc = Math.ceil(num_memory_points/10)
    } else{
        inc = 1;
    }
    for(let i = 0; i < num_memory_points; i+=inc){
        memory_labels.push((i * interval).toFixed(2)+'s');
        memory_data.push(data.memory_usage[i]);
    }

    let memoryChart = new Chart(memory_graph, {
        type: 'line',
        data: {
            labels: memory_labels,
            datasets: [{
                label: 'Memory Usage (MB)',
                data: memory_data,
            }],
        },
        options: options
    });

    
    //cpu graph
    num_cpu_points = data.cpu_usage.length;
    interval = data.duration / num_cpu_points;
    cpu_data = [];
    let cpu_labels = [];
    if (num_cpu_points > 100){
        inc = Math.ceil(num_cpu_points/10)
    } else{
        inc = 1;
    }
    for(let i = 0; i < num_cpu_points; i+=inc){
        cpu_labels.push((i * interval).toFixed(2)+'s');
        cpu_data.push(data.cpu_usage[i]);
    }
    let cpuChart = new Chart(cpu_graph, {
        type: 'line',
        data: {
            labels: memory_labels,
            datasets: [{
                label: 'CPU Usage (%)',
                data: cpu_data,
            }],
        },
        options: options
    });

    //active threads
    num_active_threads_points = data.active_threads.length;
    interval = data.duration / num_active_threads_points;
    let active_threads_labels = [];
    active_thread_data = [];
    if(num_active_threads_points > 100){
        inc = Math.ceil(num_active_threads_points/10)
    } else{
        inc = 1;
    }
    for(let i = 0; i < num_active_threads_points; i+=inc){
        active_threads_labels.push((i * interval).toFixed(2)+'s');
        active_thread_data.push(data.active_threads[i]);
    }
    let activeThreadsChart = new Chart(active_threads_graph, {
        type: 'line',
        data: {
            labels: memory_labels,
            datasets: [{
                label: 'Active Threads (#)',
                data: active_thread_data,
            }],
        },
        options: options
    });

    //response time
    num_response_time_points = data.response_times.length;
    response_time_labels = [];
    response_time_data = [];
    interval = data.duration / num_response_time_points;
    if (num_response_time_points > 100){
        inc = Math.ceil(num_response_time_points/10)
    } else{
        inc = 1;
    }
    for(let i = 0; i < num_response_time_points; i+=inc){
        response_time_labels.push((i * interval).toFixed(2)+'s');
        response_time_data.push(data.response_times[i]);
    }

    console.log(num_response_time_points);
    console.log(response_time_labels.length)
    let responseTimeChart = new Chart(response_time_graph, {
        type: 'line',
        data: {
            labels: response_time_labels,
            datasets: [{
                label: 'Response Time (ms)',
                data: response_time_data,
            }],
        },
        options: options
    });

    //network
    num_network_points = data.network_usage['bytes_recv'].length;
    interval = data.duration / num_network_points;
    let network_labels = [];
    network_sent_data = [];
    network_recv_data = [];
    if (num_network_points > 100){
        inc = Math.ceil(num_network_points/10)
    }
    for(let i = 0; i < num_network_points; i++){
        network_labels.push((i * interval).toFixed(2)+'s');
        network_sent_data.push((data.network_usage['bytes_sent'])[i]);
        network_recv_data.push((data.network_usage['bytes_recv'])[i]);
    }

    let networkChart = new Chart(network_graph, {
        type: 'line',
        data: {
            labels: memory_labels,
            datasets: [{
                label: 'Bytes Sent(MB)',
                data: network_sent_data,
            },
            {
                label: 'Bytes Received(MB)',
                data: network_recv_data,
            }],
        },
        options: options
    });

    //show graphs
    memory_graph.style.display = 'block';
    cpu_graph.style.display = 'block';
    active_threads_graph.style.display = 'block';
    response_time_graph.style.display = 'block';
    network_graph.style.display = 'block';

}
