from django.shortcuts import render
from django.http import JsonResponse, HttpResponse

import asyncio, aiohttp
import psutil
import time
import math



# Create your views here.
def index(request):
    return render(request, 'blitz/index.html')

async def run_load_test(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required.'}, status=400)

    # Get URL and number of requests from form
    try:
        url = request.POST.get('url')
        num_requests = request.POST.get('num_requests')
    except KeyError:
        return JsonResponse({'error': 'URL and number of requests required.'}, status=400)

    print(request.POST)

    print(url)
    print(num_requests)

    #Validation
    if not url:
        return JsonResponse({'error': 'URL required.'}, status=400)
    if not num_requests:
        return JsonResponse({'error': 'Number of requests required.'}, status=400)
    
    try:
        num_requests = int(num_requests)
    except ValueError:
        return JsonResponse({'error': 'Number of requests must be an integer.'}, status=400)
    
    if num_requests < 1:
        return JsonResponse({'error': 'Number of requests must be greater than 0.'}, status=400)
    
    # Run load test
    num_completed_requests = [0]
    status_codes = []
    request_times = []
    memory_usage = []
    cpu_usage = []
    active_threads = []
    network_usage = []

    print("Starting load test...")
    start_time = time.time()
    measure_sys = asyncio.create_task(measure_system_resources(memory_usage, cpu_usage, active_threads, network_usage))
    await load_test(url, num_requests, status_codes, num_completed_requests, request_times)
    measure_sys.cancel()
    end = time.time()

    num_400 = 0
    num_500 = 0
    num_200 = 0
    for code in status_codes:
        if code >= 400 and code < 500:
            num_400 += 1
        elif code >= 500:
            num_500 += 1
        else:
            num_200 += 1


    try:
        average_memory_usage = round(sum(memory_usage) / len(memory_usage),1)
    except ZeroDivisionError:
        average_memory_usage = 0

    try:
        average_cpu_usage = round(sum(cpu_usage) / len(cpu_usage), 1)
    except ZeroDivisionError:
        average_cpu_usage = 0

    return JsonResponse({
        'num_requests': num_requests,
        'duration': round(end - start_time, 2),
        'throughput': round(num_requests / (end - start_time), 2),
        'average_latency': round((end - start_time) / num_requests * 1000,3),
        'average_memory_usage': average_memory_usage,
        'average_cpu_usage': average_cpu_usage,
        'average_response_time': round(sum(request_times) / len(request_times), 3),
        'median_response_time':round(sorted(request_times)[len(request_times) // 2],3) ,
        'min_response_time': round(min(request_times),4),  #milliseconds
        'max_response_time': round(max(request_times),3),
        'num_success': num_200,
        'num_failed': num_400 + num_500,
        'status_codes': {
            '200': num_200,
            '400': num_400,
            '500': num_500,
        },
        'network_usage': {
            'bytes_sent': [x[0] for x in network_usage],
            'bytes_recv': [x[1] for x in network_usage],
        },
        'active_threads': active_threads,
        'cpu_usage': cpu_usage,
        'memory_usage': memory_usage,
        'response_times': request_times,
        'active_threads': active_threads,
    })

async def load_test(url, num_requests, status_codes, num_completed_requests, request_times):
    """Make the given number of requests to the given URL."""
    async with aiohttp.ClientSession() as session:
        tasks = [asyncio.ensure_future(make_request(session, url, status_codes, num_completed_requests, request_times)) for _ in range(num_requests)]
        results = await asyncio.gather(*tasks)
        print(len(results))
    
    return "Done!"
            
async def make_request(session, url, status_codes, num_completed_requests, request_times):
    """Make a request to the given URL and append the status code and request time to the lists."""
    async with session.get(url) as response:
        start = time.time()
        res_json = await response.json()
        status = response.status
        status_codes.append(status)
        num_completed_requests[0] += 1
        end = time.time()
        request_times.append((end - start) * 1000)
        return response

async def measure_system_resources(memory_usage, cpu_usage, active_threads, network_usage, interval=0.1, samples=5):
    """Measure system resources and append to lists. Samples every 0.1 seconds by default. Takes 5 samples to get an average by default."""
    
    process = psutil.Process()
    while True:

        temp_memory = []
        temp_cpu = []

        for i in range(samples):
            memory = process.memory_info().rss / 1024 ** 2
            cpu = process.cpu_percent()
            temp_memory.append(memory)
            temp_cpu.append(cpu)
            await asyncio.sleep(interval)

        #gets average memory usage and cpu usage
        memory = sum(temp_memory) / len(temp_memory)
        cpu = sum(temp_cpu) / len(temp_cpu)
        bytes_sent = psutil.net_io_counters().bytes_sent/  1024 ** 2
        bytes_recv = psutil.net_io_counters().bytes_recv/ 1024 ** 2
        network_usage.append((bytes_sent, bytes_recv))

        threads = len(asyncio.all_tasks())
        print(f'Active threads: {threads}')
        memory_usage.append(memory)
        cpu_usage.append(cpu)
        active_threads.append(threads)

