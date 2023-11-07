
window.onload = function(){
    initialize();
}

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

function displayAlert(message, type){

    alert = document.querySelector('.alert');
    alert.innerHTML = message;
    alert.style.display = 'block';
    alert.classList.add(type);
    setTimeout(() => {
        alert.style.display = 'none';
        alert.classList.remove(type);
    }, 3000);
    
}

//sends POST request to run load test   
function initialize(){

    button = document.querySelector('#run-load-test')
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
        //this.innerHTML = '<div class="lds-circle"><div></div></div>Run load test'
        this.innerHTML = `
        <div class="flex gap-2"role="status">
            <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-yellow-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span class="">Running...</span>
        </div>
        `
        fetch("/run", {
            method: "POST",
            body: formData,
            headers: {
                "X-CSRFToken": csrftoken,
            }
          }).then(response => response.json()).then(data =>{

            this.disabled = false;
            this.innerHTML = '-> Run load test';

            if (data.error){
                displayAlert(data.error, 'error');
                return;
            }

            displayResults(data);
            

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
        inc = Math.ceil(num_response_time_points/1)
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
