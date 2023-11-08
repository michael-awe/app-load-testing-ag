import asyncio, aiohttp
import psutil
import time
import math

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
        status = response.status
        status_codes.append(status)
        num_completed_requests[0] += 1
        end = time.time()
        request_times.append((end - start) * 1000)
        return response

async def measure_system_resources(memory_usage, cpu_usage, active_threads, network_usage, interval=0.05, samples=5):
    """Measure system resources and append to lists. Samples every 0.1 seconds by default. Uses 5 samples to get an average sample by default."""
    
    process = psutil.Process()
    start_bytes_sent = psutil.net_io_counters().bytes_sent
    start_bytes_recv = psutil.net_io_counters().bytes_recv
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
        bytes_sent = (psutil.net_io_counters().bytes_sent-start_bytes_sent)/  (1024 ** 2)
        bytes_recv = (psutil.net_io_counters().bytes_recv-start_bytes_recv)/ (1024 ** 2)
        network_usage.append((bytes_sent, bytes_recv))

        threads = len(asyncio.all_tasks())
        print(f'Active threads: {threads}')
        memory_usage.append(memory)
        cpu_usage.append(cpu)
        active_threads.append(threads)