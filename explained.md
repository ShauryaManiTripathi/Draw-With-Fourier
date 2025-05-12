# The Mathematics of Fourier Series Drawings

## Introduction to Fourier Drawing

Fourier Series representation allows any periodic function to be decomposed into a sum of sinusoids. This mathematical concept has a fascinating visual application: transforming hand-drawn curves into elegant animations composed of rotating circles.

## Mathematical Foundation

### Parametric Curves as Complex Functions

When considering a drawing as a time-parameterized path, each point has two components:
- A horizontal position x(t)
- A vertical position y(t)

These components are elegantly unified using complex numbers:
```
f(t) = x(t) + i·y(t)
```

Where i represents the imaginary unit. This representation transforms a two-dimensional drawing into a one-dimensional complex function of time.

### The Discrete Fourier Transform

For a drawing sampled at N discrete time points, the Discrete Fourier Transform (DFT) calculates coefficients:

```
c_n = (1/N) * Σ[f(t_k) * e^(-i2πnk/N)]
```

Where:
- n represents the frequency number
- k ranges from 0 to N-1
- Each coefficient c_n encapsulates amplitude and phase information for a particular frequency

This calculation is implemented in code as:

```go
func calculateCoefficient(n int, points []Point) complex128 {
    sum := complex(0, 0)
    
    for _, point := range points {
        z := complex(float64(point.X), float64(point.Y))
        angle := -2.0 * math.Pi * float64(n) * point.Time
        exponential := cmplx.Exp(complex(0, angle))
        sum += z * exponential
    }
    
    return sum / complex(float64(len(points)), 0)
}
```

### Vector Representation

Each Fourier coefficient corresponds to a rotating vector with:
- A frequency (n) determining rotation speed
- Magnitude and angle determined by the complex coefficient c_n

The simplest example is a circle, which requires only two vectors:
```go
vectors := []DrawVector{
    {N: 0, Real: 0.00, Imaginary: 0.00},  // Center offset
    {N: 1, Real: radius, Imaginary: 0.00}, // Circle with radius
}
```

### Optimization Strategy

For complex drawings, coefficients are typically ordered by importance:
1. Begin with n=0 (the average position)
2. Add coefficients in alternating positive and negative frequencies: 1, -1, 2, -2, etc.
3. Continue until reaching a predetermined maximum or sufficient approximation quality

This ordering strategy efficiently captures the most significant features with fewer coefficients.

## Animation and Drawing Reconstruction

The drawing is reconstructed by calculating the position at each moment in time:

```
position(t) = Σ[c_n * e^(i2πnt)]
```

For each time t (normalized between 0 and 1), the formula sums the contribution of each vector:
- c_n is the complex coefficient for frequency n
- e^(i2πnt) represents rotation at angular velocity 2πn

Visually, this manifests as:
1. A series of interconnected circles, each rotating at its corresponding frequency
2. The final point tracing the original drawing
3. A visualization of mathematical harmony emerging from apparent complexity

This elegant transformation bridges art and mathematics, demonstrating how complex visual patterns can be reduced to and recreated from simple harmonic motion.