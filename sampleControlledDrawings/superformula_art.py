import numpy as np
import matplotlib.pyplot as plt
import requests
import json
import os
import math
from datetime import datetime

def superformula(phi, a, b, m, n1, n2, n3):
    """
    Calculates the superformula value for a given angle phi.
    The superformula can generate a wide variety of natural-looking shapes.
    """
    t1 = abs(math.cos(m * phi / 4) / a)
    t2 = abs(math.sin(m * phi / 4) / b)
    return math.pow(t1**n2 + t2**n3, -1/n1)

def generate_complex_drawing(num_points=15000, scale=200):
    """
    Generate a complex drawing using multiple superformulas
    Returns points in the API-expected format
    """
    points = []
    
    # Create several layers with different parameters
    layers = [
        # Main shape
        {"a": 1, "b": 1, "m": 6, "n1": 1, "n2": 7, "n3": 8, "weight": 1.0, "color": "blue"},
        # First variation
        {"a": 1, "b": 1, "m": 3, "n1": 2, "n2": 7, "n3": 4, "weight": 0.5, "color": "red"},
        # Second variation
        {"a": 1, "b": 1, "m": 5, "n1": 2, "n2": 13, "n3": 8, "weight": 0.3, "color": "green"},
        # Animation components
        {"a": 1, "b": 1, "m": 2, "n1": 0.7, "n2": 7, "n3": 15, "weight": 0.2, "color": "purple"}
    ]
    
    # For visualization
    vis_points = []
    for layer in layers:
        layer_points_x = []
        layer_points_y = []
        vis_points.append((layer_points_x, layer_points_y, layer["color"]))
    
    # Generate combined points for all layers
    phi_values = np.linspace(0, 2 * np.pi, num_points)
    
    for i, phi in enumerate(phi_values):
        x_combined = 0
        y_combined = 0
        
        for j, layer in enumerate(layers):
            # Calculate radius using superformula
            r = superformula(
                phi, 
                layer["a"], 
                layer["b"], 
                layer["m"], 
                layer["n1"], 
                layer["n2"], 
                layer["n3"]
            ) * scale * layer["weight"]
            
            # Convert polar to cartesian coordinates
            x = r * np.cos(phi)
            y = r * np.sin(phi)
            
            # Add time-based animation (makes the drawing more dynamic)
            time_factor = i / num_points
            animation_factor = np.sin(time_factor * 2 * np.pi * 2) * 20
            x += animation_factor * np.sin(phi * layer["m"])
            y += animation_factor * np.cos(phi * layer["m"])
            
            # Add to combined point
            x_combined += x
            y_combined += y
            
            # Save for visualization
            vis_points[j][0].append(x)
            vis_points[j][1].append(y)
        
        # Time must start at 0 and increase sequentially
        time = i / (num_points - 1)
        
        # Add combined point to the list for API
        points.append({"time": time, "x": int(x_combined), "y": int(y_combined)})
    
    # Create PNG visualization
    create_visualization(vis_points, points, scale)
    
    return points

def create_visualization(vis_points, combined_points, scale):
    """Create a visualization of the drawing and save as PNG"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"superformula_art_{timestamp}.png"
    
    plt.figure(figsize=(10, 10), facecolor='black')
    
    # Plot each layer with its color
    for x_vals, y_vals, color in vis_points:
        plt.plot(x_vals, y_vals, color=color, alpha=0.5, linewidth=0.8)
    
    # Plot combined points
    combined_x = [p["x"] for p in combined_points]
    combined_y = [p["y"] for p in combined_points]
    plt.plot(combined_x, combined_y, color='white', linewidth=1.5)
    
    # Set plot properties
    plt.axis('equal')
    plt.xlim(-scale*1.5, scale*1.5)
    plt.ylim(-scale*1.5, scale*1.5)
    plt.title("Superformula Art", color='white', fontsize=16)
    plt.grid(False)
    plt.axis('off')
    
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
    
    # Generate the complex drawing
    print("Generating 15000 points for a complex superformula drawing...")
    points = generate_complex_drawing(num_points=15000)
    
    # Send the drawing to the API with higher vector count for better detail
    print("Sending drawing to API...")
    result = send_drawing(points, max_vectors=150)
    
    if result:
        print("Success! API response:")
        print(json.dumps(result, indent=2))
        print(f"Drawing ID: {result.get('id')}")
        print(f"Visit http://localhost:3000 to see your complex drawing")
    else:
        print("Failed to send drawing to API")
