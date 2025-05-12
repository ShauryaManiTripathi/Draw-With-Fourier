import numpy as np
import matplotlib.pyplot as plt
import requests
import json
import math
from datetime import datetime

def generate_single_stroke_art(num_points=15000, scale=200, complexity=3):
    """
    Generate a complex but continuous single-stroke drawing where
    the starting and ending points are the same.
    
    Returns points in the API-expected format
    """
    points = []
    
    # Parameters for a complex continuous curve
    a, b = 80, 100  # Base shape parameters
    c, d = 20, 30   # Modulation parameters
    n_lobes = 5     # Number of main lobes
    n_waves = 8     # Number of waves per lobe
    
    # Use parametric equations to ensure a continuous closed curve
    t = np.linspace(0, 2*np.pi, num_points)
    
    # Base formula creates a continuous shape that's closed (same start/end)
    r_base = a + b * np.sin(n_lobes * t) 
    
    # Add complex details to make the art interesting
    modulation = c * np.sin(n_waves * t) + d * np.cos(complexity * n_waves * t)
    r = r_base + modulation * np.sin(t * 2 * complexity)
    
    # Convert to cartesian coordinates
    x = r * np.cos(t)
    y = r * np.sin(t)
    
    # Add some additional complexity with spiral-like decorations
    spiral_factor = 0.2 * scale * np.sin(t * complexity)
    spiral_x = spiral_factor * np.cos(t * n_lobes * 2)
    spiral_y = spiral_factor * np.sin(t * n_lobes * 2)
    
    x += spiral_x
    y += spiral_y
    
    # Scale the drawing
    x = x * scale / 200
    y = y * scale / 200
    
    # Create the API points (ensuring continuous path in time order)
    for i in range(num_points):
        # Time must start at 0 and increase sequentially
        time = i / (num_points - 1)
        
        # Add point to the list for API
        points.append({"time": time, "x": int(x[i]), "y": int(y[i])})
    
    # Ensure the curve is closed (last point = first point)
    points[-1]["x"] = points[0]["x"]
    points[-1]["y"] = points[0]["y"]
    
    # Create PNG visualization
    create_visualization(points, scale)
    
    return points

def create_visualization(points, scale):
    """Create a visualization of the drawing and save as PNG"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"single_stroke_art_{timestamp}.png"
    
    x_vals = [p["x"] for p in points]
    y_vals = [p["y"] for p in points]
    
    # Create a figure with a gradient background
    fig = plt.figure(figsize=(10, 10), facecolor='black')
    ax = fig.add_subplot(111)
    
    # Create colored line segments that transition along the path
    points_array = np.array(list(zip(x_vals, y_vals)))
    
    # Create a colorful visualization with gradient colors
    segments = []
    colors = []
    for i in range(len(points)-1):
        segments.append([points_array[i], points_array[i+1]])
        # Color based on position in the drawing (creates a rainbow effect)
        colors.append(i/len(points))
    
    # Plot the segments with a color gradient
    from matplotlib.collections import LineCollection
    lc = LineCollection(segments, cmap='hsv', linewidth=2)
    lc.set_array(np.array(colors))
    ax.add_collection(lc)
    
    # Mark the starting point
    ax.plot(x_vals[0], y_vals[0], 'o', color='white', markersize=8)
    
    # Set plot properties
    margin = scale * 0.2
    ax.set_xlim(min(x_vals) - margin, max(x_vals) + margin)
    ax.set_ylim(min(y_vals) - margin, max(y_vals) + margin)
    ax.set_aspect('equal')
    ax.set_title("Single Stroke Art", color='white', fontsize=16)
    ax.set_axis_off()
    
    # Save as PNG
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='black')
    print(f"Saved visualization as {filename}")
    plt.close()
    
    return filename

def send_drawing(points, max_vectors=150, api_url="http://localhost:8081"):
    endpoint = f"{api_url}/drawing"
    
    # Prepare the request payload
    payload = {
        "points": points,
        "maxVectors": max_vectors
    }
    
    try:
        # Send the POST request
        headers = {"Content-Type": "application/json"}
        response = requests.post(endpoint, json=payload, headers=headers)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error sending request: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response status code: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return None

if __name__ == "__main__":
    # Install matplotlib if not already installed
    try:
        import matplotlib
    except ImportError:
        import pip
        pip.main(['install', 'matplotlib'])
        print("Installed matplotlib for visualization")
    
    # Generate the single stroke drawing
    print("Generating 15000 points for a complex single-stroke drawing...")
    points = generate_single_stroke_art(num_points=15000, scale=250, complexity=3)
    
    # Send the drawing to the API with higher vector count for better detail
    print("Sending drawing to API...")
    result = send_drawing(points, max_vectors=200)
    
    if result:
        print("Success! API response:")
        print(json.dumps(result, indent=2))
        print(f"Drawing ID: {result.get('id')}")
        print(f"Visit http://localhost:3000 to see your single stroke art")
    else:
        print("Failed to send drawing to API")
