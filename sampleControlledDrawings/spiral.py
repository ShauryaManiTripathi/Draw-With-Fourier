import numpy as np
import requests
import json
import math

def generate_spiral(center_x=0, center_y=0, a=10, b=1, num_turns=10, num_points=15000):
    """
    Generate an Archimedean spiral using the equation r = a + b*theta
    Returns points in the API-expected format
    """
    points = []
    
    # Calculate points along the spiral
    for i in range(num_points):
        # Calculate normalized position and corresponding angle
        t = i / (num_points - 1)
        theta = t * num_turns * 2 * math.pi
        
        # Calculate radius using spiral equation
        r = a + b * theta
        
        # Convert to Cartesian coordinates
        x = center_x + int(r * math.cos(theta))
        y = center_y + int(r * math.sin(theta))
        
        # Time value for API
        time = t
        
        # Add point to the list
        points.append({"time": time, "x": x, "y": y})
    
    return points

def generate_golden_spiral(center_x=0, center_y=0, scale=10, num_turns=8, num_points=15000):
    """
    Generate a logarithmic (golden) spiral
    Returns points in the API-expected format
    """
    points = []
    
    # Calculate points along the spiral
    for i in range(num_points):
        # Calculate normalized position and corresponding angle
        t = i / (num_points - 1)
        theta = t * num_turns * 2 * math.pi
        
        # Golden spiral uses logarithmic growth
        b = 0.17  # Controls how quickly the spiral grows
        r = scale * math.exp(b * theta)
        
        # Convert to Cartesian coordinates
        x = center_x + int(r * math.cos(theta))
        y = center_y + int(r * math.sin(theta))
        
        # Time value for API
        time = t
        
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
    # You can choose which spiral to generate and send
    
    # Option 1: Generate an Archimedean spiral
    print("Generating 15000 points for an Archimedean spiral...")
    archimedean_points = generate_spiral(num_points=15000, a=10, b=1, num_turns=15)
    
    print("Sending Archimedean spiral to API...")
    result = send_drawing(archimedean_points)
    
    if result:
        print("Success! API response:")
        print(json.dumps(result, indent=2))
        print(f"Drawing ID: {result.get('id')}")
        print(f"Visit http://localhost:3000 to see your Archimedean spiral")
    else:
        print("Failed to send Archimedean spiral to API")
    
    # Option 2: Generate a Golden spiral (uncomment to use)
    '''
    print("Generating 15000 points for a Golden spiral...")
    golden_points = generate_golden_spiral(num_points=15000, scale=1, num_turns=10)
    
    print("Sending Golden spiral to API...")
    result = send_drawing(golden_points)
    
    if result:
        print("Success! API response:")
        print(json.dumps(result, indent=2))
        print(f"Drawing ID: {result.get('id')}")
        print(f"Visit http://localhost:3000 to see your Golden spiral")
    else:
        print("Failed to send Golden spiral to API")
    '''
