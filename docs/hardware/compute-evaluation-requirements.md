# Representative compute evaluation requirements

Candidate compute hardware must be evaluated with the exact Linux image, Qt
version, compositor, GPU driver and both native displays. Record CPU topology,
memory, storage, thermal solution, power supply and firmware.

Required development observations include:

- cold and warm startup to UI-ready and first telemetry;
- driver, cabin and concurrent 1/10/20/30/60 Hz profiles;
- 10-minute standard and 30–60-minute soak memory evidence;
- CPU, RSS, PSS, private dirty memory, threads and file descriptors;
- frame percentiles and threshold counts for both outputs;
- software and accelerated rendering comparison;
- thermal throttling under sustained concurrent load;
- graceful shutdown and recovery from display/server loss;
- bounded simulator delivery with a slow or disconnected peer.

Later vehicle-power, EMC and environmental testing requires separate
engineering review. No physical vehicle bus may be opened by the milestone 1.4
tools.
