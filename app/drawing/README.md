# Drawing API

## Database Schema Updates

The drawing storage has been updated to use `MEDIUMTEXT` instead of `TEXT` for storing:
- `originalPoints`: Raw drawing points from user input
- `drawVectors`: Calculated Fourier transform vectors

This change removes the previous limitation of approximately 1400 points per drawing, allowing for much more complex and detailed drawings.

## Technical Details

- `TEXT`: ~65KB (previous limit, ~1400 points)
- `MEDIUMTEXT`: ~16MB (new limit, ~350,000 points)

The system still maintains the default limit of 100 vectors for performance reasons, but the underlying storage now supports significantly larger drawings.
