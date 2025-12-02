
import re
import base64

file_path = r'c:\Users\Administrator.DESKTOP-0GUD903\Desktop\AI\jia\jia-main2\jia-main\js\app-view.js'
output_path = r'c:\Users\Administrator.DESKTOP-0GUD903\Desktop\AI\jia\jia-main2\jia-main\decoded_view.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'window\.ENCODED_VIEW\s*=\s*"(.*?)";', content, re.DOTALL)
if match:
    encoded_str = match.group(1)
    # Remove any newlines or whitespace that might be in the string if it was split across lines (though JS strings usually aren't without backslashes)
    encoded_str = encoded_str.replace('\n', '').replace('\r', '')
    
    try:
        decoded_bytes = base64.b64decode(encoded_str)
        decoded_str = decoded_bytes.decode('utf-8')
        
        with open(output_path, 'w', encoding='utf-8') as f_out:
            f_out.write(decoded_str)
        print("Decoding successful.")
    except Exception as e:
        print(f"Decoding failed: {e}")
else:
    print("Could not find ENCODED_VIEW string.")
