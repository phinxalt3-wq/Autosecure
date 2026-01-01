import sys
import json
import base64
import requests
import re

def process_data(data):
    host = data.get('host')
    
    # Step 1: Initial login redirect
    loginRedirectUrl = "https://sisu.xboxlive.com/connect/XboxLive/?state=login&cobrandId=8058f65d-ce06-4c30-9559-473c9275a65d&tid=896928775&ru=https://www.minecraft.net/en-us/login&aid=1142970254"
    
    try:
        # Get the login redirect
        login_response = requests.get(loginRedirectUrl, allow_redirects=False)
        
        if login_response.status_code != 302:
            return 'No result'

        # Step 2: Handle the access token redirection
        location = login_response.headers.get('Location')
        if location:
            cookie = f"__Host-MSAAUTH={host}"
            accessTokenRedirect = requests.get(
                location, 
                headers={"Cookie": cookie}, 
                allow_redirects=False
            )
            
            if accessTokenRedirect.status_code == 302:
                location = accessTokenRedirect.headers.get('Location')
                
                # Step 3: Get the access token
                if location:
                    accessTokenRedirect = requests.get(location, allow_redirects=False)
                    
                    if accessTokenRedirect.status_code == 302:
                        location = accessTokenRedirect.headers.get('Location')
                        
                        if location:
                            # Extract access token from URL using regex
                            match = re.search(r'accessToken=([A-Za-z0-9\-_]+)', location)
                            if match:
                                accessToken = match.group(1)
                                
                                # Fix base64 padding issue
                                accessToken = accessToken + "=" * (4 - len(accessToken) % 4)
                                
                                # Decode the base64 access token
                                decoded_data = base64.b64decode(accessToken).decode('utf-8')
                                json_data = json.loads(decoded_data)
                                
                                # Extract the 'uhs' value
                                uhs = json_data[0].get('Item2', {}).get('DisplayClaims', {}).get('xui', [{}])[0].get('uhs')
                                
                                # Extract XSTS token
                                xsts = ""
                                for item in json_data:
                                    if item.get('Item1') == "rp://api.minecraftservices.com/":
                                        xsts = item.get('Item2', {}).get('Token', '')
                                        break
                                if not xsts:
                                    return 'No result'

                                # Extract the 'gtg' (gamertag)
                                gtg = None
                                for item in json_data:
                                    if item.get('Item1') == "http://xboxlive.com":
                                        if len(item.get('Item2', {}).get('DisplayClaims', {}).get('xui', [])) > 0:
                                            gtg = item['Item2']['DisplayClaims']['xui'][0].get('gtg')
                                            break
                                
                                if not gtg:
                                    return 'No result'

                                # Return result
                                return {
                                    'xbl': f"XBL3.0 x={uhs};{xsts}",
                                    'gtg': gtg
                                }
                            
    except Exception as e:
        return f"Error processing data: {e}"
    
    return 'No result'

# Read input data from stdin
if __name__ == "__main__":
    input_data = sys.stdin.read()
    data = json.loads(input_data)  # Parse the JSON data from stdin

    # Process the data and output result
    result = process_data(data)
    sys.stdout.write(json.dumps(result) if result else '{"error": "No result"}\n')