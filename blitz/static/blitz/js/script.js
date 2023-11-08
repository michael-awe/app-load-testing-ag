
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

function downSample(data){

    if (data.length < 1000) return data;

    console.log('downsampling')

    let downsampled = [];
    let binSize = Math.floor(data.length / 1000);

    for (let i = 0; i < data.length; i += binSize) {
        let block = data.slice(i, i + binSize); 
        let average = block.reduce((total, b) => total + b, 0) / block.length; 
        downsampled.push(average); 
    }

    return downsampled;

}

function renderLineChart(title, data,duration, graphElement){

    let options = {
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

    data = downSample(data);
    graph_labels = [];
    graph_data = [];

    interval = duration/data.length;

    for(let i = 0; i < data.length; i++){
        graph_labels.push(((i+1) * interval).toFixed(2)+'s');
        graph_data.push(data[i]);
    }
    new Chart(graphElement, {
        type: 'line',
        data: {
            labels: graph_labels,
            datasets: [{
                label: title,
                data: graph_data,
            }],
        },
        options: options
    });

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

    console.log(data)
    
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

    //memory graph
    renderLineChart('Memory Usage (MB)', data.memory_usage, data.duration, memory_graph)
    
    //Renders CPU graph
    renderLineChart('CPU Usage (%)',data.cpu_usage, data.duration, cpu_graph)

    //Renders Active Threads graph
    renderLineChart('Active Threads (#)', data.active_threads, data.duration, active_threads_graph);

    //Renders Response Time graph
    renderLineChart('Response Times (ms)', data.response_times, data.duration, response_time_graph)


    //Renders Network Usage graphs
    renderLineChart('Network Usage (MB)', data.network_usage['bytes_sent'], data.duration, network_graph)
    renderLineChart('Network Usage (MB)', data.network_usage['bytes_recv'], data.duration, network_graph)

}






