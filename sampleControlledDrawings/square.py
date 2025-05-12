import numpy as np
import requests
import json

def generate_square(center_x=0, center_y=0, side_length=200, num_points=15000):
    """
    Generate a square with the given side length.
    Returns points in the API-expected format
    """
    points = []
    
    # Calculate points per side (ensuring we get exactly num_points in total)
    points_per_side = num_points // 4
    extra_points = num_points % 4
    
    half_side = side_length / 2
    point_index = 0
    total_points = 0
    
    # Bottom side (left to right)
    bottom_points = points_per_side + (1 if extra_points > 0 else 0)
    for i in range(bottom_points):
        t = i / (bottom_points - 1)
        x = center_x - half_side + t * side_length
        y = center_y - half_side
        time = total_points / (num_points - 1) if total_points > 0 else 0
        points.append({"time": time, "x": int(x), "y": int(y)})
        total_points += 1
    
    # Right side (bottom to top)
    right_points = points_per_side + (1 if extra_points > 1 else 0)
    for i in range(right_points):
        t = i / (right_points - 1)
        x = center_x + half_side
        y = center_y - half_side + t * side_length
        time = total_points / (num_points - 1)
        points.append({"time": time, "x": int(x), "y": int(y)})
        total_points += 1
    
    # Top side (right to left)
    top_points = points_per_side + (1 if extra_points > 2 else 0)
    for i in range(top_points):
        t = i / (top_points - 1)
        x = center_x + half_side - t * side_length
        y = center_y + half_side
        time = total_points / (num_points - 1)
        points.append({"time": time, "x": int(x), "y": int(y)})
        total_points += 1
    
    # Left side (top to bottom)
    left_points = points_per_side
    for i in range(left_points):
        t = i / (left_points - 1)
        x = center_x - half_side
        y = center_y + half_side - t * side_length
        time = total_points / (num_points - 1)
        points.append({"time": time, "x": int(x), "y": int(y)})
        total_points += 1
    
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
    # Generate points for a square
    print("Generating 15000 points for a square...")
    points = generate_square(num_points=15000, side_length=200)
    
    # Send the drawing to the API
    print("Sending drawing to API...")
    result = send_drawing(points)
    
    if result:
        print("Success! API response:")
        print(json.dumps(result, indent=2))
        print(f"Drawing ID: {result.get('id')}")
        print(f"Visit http://localhost:3000 to see your square")
    else:
        print("Failed to send drawing to API")
