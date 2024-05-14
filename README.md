# setup-luamake

Use [luamake](https://github.com/actboy168/luamake) in GitHub Actions.

## Usage

```yaml
    - uses: actboy168/setup-luamake@master
      with:
        # The branch, tag or SHA to checkout. 
        # Otherwise, uses the default branch.
        ref: ''
    - run: luamake
```
