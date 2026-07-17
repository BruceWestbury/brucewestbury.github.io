# Personal Page for Bruce Westbury

This is my personal web page. It was created to provide inspection of some results obtained from computer calculations.

## Exceptional series tables

The pages under `projects/exceptional/` render a checked-in snapshot of the
mathematics-only JSON published as Zenodo record
[`21335054`](https://zenodo.org/records/21335054). Refresh and validate that
snapshot with:

```bash
python3 scripts/sync_exceptional_data.py
python3 scripts/check_exceptional_site.py
node --check assets/js/exceptional-tables.js
```

The browser only formats stored data. It does not perform representation-theory
or symbolic calculations.
