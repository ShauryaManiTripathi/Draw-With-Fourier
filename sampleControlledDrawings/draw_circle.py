import requests
import math
import json

def generate_circle_points(center_x=0, center_y=0, radius=100, num_points=1000):
    points = []
    
    for i in range(num_points):
        # Calculate angle (0 to 2π)
        angle = 2 * math.pi * i / num_points
        
        # Calculate x,y coordinates on the circle
        x = center_x + int(radius * math.cos(angle))
        y = center_y + int(radius * math.sin(angle))
        
        # Time must start at 0 and increase sequentially (API requirement)
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
    # Generate 1000 points for a circle with radius 100
    print("Generating 1000 points for a circle...")
    circle_points = generate_circle_points(num_points=1000)
    
    # Send the drawing to the API
    print("Sending drawing to API...")
    result = send_drawing(circle_points)
    
    if result:
        print("Success! API response:")
        print(json.dumps(result, indent=2))
        print(f"Drawing ID: {result.get('id')}")
        print(f"Visit http://localhost:3000 to see your circle")
    else:
        print("Failed to send drawing to API")
