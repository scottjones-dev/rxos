# Memory analysis

The Linux runner samples RSS and virtual memory from process status, PSS and
private dirty memory from `smaps_rollup`, plus threads and open file
descriptors. Missing kernel data is recorded as `null` with a support note.

The latter half of an observation is fitted with a simple least-squares slope.
The automated label is:

- `bounded warm-up` when a standard run has no material latter-half RSS or
  private-dirty slope;
- `slow growth` when a positive trend is present but does not meet the
  leak-like rule;
- `leak-like` only when a run of at least ten minutes has both RSS growth above
  2,048 KiB/min and private-dirty growth above 1,024 KiB/min;
- `insufficient evidence` for shorter or unsupported observations.

These descriptive boundaries are investigation aids, not target-hardware
budgets. A leak conclusion also requires reproduction and resource-level
profiling. Thread and file-descriptor growth is reviewed independently because
stable memory can conceal a resource leak.
