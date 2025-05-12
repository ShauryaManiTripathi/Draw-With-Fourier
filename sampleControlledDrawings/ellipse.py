import numpy as np
import requests
import json
import math

def generate_ellipse(center_x=0, center_y=0, a=150, b=80, num_points=15000):
    """
    Generate an ellipse with semi-major axis a and semi-minor axis b.
    Returns points in the API-expected format
    """
    points = []
    
    for i in range(num_points):
        # Calculate angle (0 to 2π)
        angle = 2 * math.pi * i / num_points
        
        # Calculate x,y coordinates on the ellipse
        x = center_x + int(a * math.cos(angle))
        y = center_y + int(b * math.sin(angle))
        
        # Time must start at 0 and increase sequentially
        time = 0 if i == 0 else i / (num_points - 1)
        
        # Add point to the list
        points.append({"time": time, "x": x, "y": y})
    
    return points

def send_drawing(points, max_vectors=100, api_url="http://localhost:8081"):
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
    # Generate points for an ellipse
    print("Generating 15000 points for an ellipse...")
    points = generate_ellipse(num_points=15000, a=150, b=80)
    
    # Send the drawing to the API
    print("Sending drawing to API...")
    result = send_drawing(points)
    
    if result:
        print("Success! API response:")
        print(json.dumps(result, indent=2))
        print(f"Drawing ID: {result.get('id')}")
        print(f"Visit http://localhost:3000 to see your ellipse")
    else:
        print("Failed to send drawing to API")
