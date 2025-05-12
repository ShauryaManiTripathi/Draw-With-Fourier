import numpy as np
import requests
import json

def generate_curly_maze(center_x=0, center_y=0, size=1000, complexity=5, density=0.5, num_points=50000):
    """
    Generate a curly maze pattern using perturbed nested paths.
    Returns points in the API-expected format
    """
    points = []
    
    # Generate main spiral path
    main_points = int(num_points * 0.7)  # 70% of points for main path
    t = np.linspace(0, complexity * 2 * np.pi, main_points)
    
    # This creates a spiral that gets perturbed to form curly patterns
    radius = size * (1 - t/(complexity * 2 * np.pi))
    
    # Add perturbations to create curl effects
    curl_x = np.sin(density * t) * np.cos(t/2) * (radius/3)
    curl_y = np.cos(density * t) * np.sin(t/3) * (radius/3)
    
    x_vals = radius * np.cos(t) + curl_x + center_x
    y_vals = radius * np.sin(t) + curl_y + center_y
    
    # Create points for the main path in API format
    for i in range(main_points):
        time = i / (num_points - 1)
        points.append({"time": time, "x": int(x_vals[i]), "y": int(y_vals[i])})
    
    # Add cross paths
    remaining_points = num_points - main_points
    points_per_cross = remaining_points // complexity
    
    total_added = main_points
    
    for i in range(1, complexity):
        # Add cross paths at different angles
        angle = i * np.pi / complexity
        cross_t = np.linspace(0, 2*np.pi, points_per_cross)
        cross_r = size * 0.3 * i / complexity
        
        x_center = center_x + size * 0.5 * np.cos(angle)
        y_center = center_y + size * 0.5 * np.sin(angle)
        
        for j in range(points_per_cross):
            x = cross_r * np.cos(cross_t[j]) + x_center
            y = cross_r * np.sin(cross_t[j]) + y_center
            
            time = total_added / (num_points - 1)
            points.append({"time": time, "x": int(x), "y": int(y)})
            total_added += 1
            
            if total_added >= num_points:
                break
        
        if total_added >= num_points:
            break
    
    return points

def send_drawing(points, max_vectors=1000, api_url="http://localhost:8081"):
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
    # Generate points for a curly maze
    print("Generating 15000 points for a curly maze...")
    points = generate_curly_maze(num_points=15000, size=200, complexity=7, density=0.8)
    
    # Send the drawing to the API
    print("Sending drawing to API...")
    result = send_drawing(points)
    
    if result:
        print("Success! API response:")
        print(json.dumps(result, indent=2))
        print(f"Drawing ID: {result.get('id')}")
        print(f"Visit http://localhost:3000 to see your curly maze")
    else:
        print("Failed to send drawing to API")
