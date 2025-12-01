from http.server import BaseHTTPRequestHandler
import json
import requests
from lxml import html
import pandas as pd
from datetime import datetime

# Gets transfer credit info from the Maryland articulation website
def get_transfer_courses(school_id, year, old_class, umbc_class):
    # If no year given, use current year
    if year is None or year == "":
        year = datetime.now().year

    # Build the website URL with our search options
    url = "https://articulation.usmd.edu/equivalencies"
    
    search_options = {
        "q[filter_by]": "",
        "q[teaching_university_id_eq]": school_id,
        "q[home_university_id_eq]": 12645,  # This is UMBC's ID
        "q[effective_in_terms_range]": f"2018,fall-{year+1},spring",
        "q[teaching_courses_name_or_teaching_courses_code_cont]": old_class,
        "q[home_courses_name_or_gen_ed_cont]": umbc_class,
        "q[transfer_type_in][]": ["course_transfer", "gen_ed_transfer", "non_transfer_university"],
        "page_size": 100,
    }
    
    # to avoid website blocking us
    fake_browser = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0"
    }

    # get the webpage
    response = requests.get(url, params=search_options, headers=fake_browser)
    response.raise_for_status()
    
    # parse the HTML to find the table
    page = html.fromstring(response.content)
    table = page.xpath('//*[@id="equivalencies-table"]')

    # Convert table to a pandas DataFrame (like a spreadsheet)
    table_html = html.tostring(table[0], encoding="unicode")
    df = pd.read_html(table_html)[0]
    return df


# finds which columns have the data we need
def find_columns(df):
    # make column names lowercase (easier matching)
    columns = {}
    for col in df.columns:
        columns[str(col).strip().lower()] = col
    
    # find the course column
    course_col = None
    for name in columns:
        if "course" in name and "transfer" not in name:
            course_col = columns[name]
            break
    
    # find the credits column
    credits_col = None
    for name in columns:
        if "credit" in name:
            credits_col = columns[name]
            break
    
    # find the "transfers as" column
    transfers_col = None
    for name in columns:
        if "transfer" in name:
            transfers_col = columns[name]
            break
    
    # if we couldn't find transfers column, just use the last column
    if transfers_col is None and len(df.columns) >= 3:
        transfers_col = df.columns[-1]
    
    return course_col, credits_col, transfers_col


# removes "Course Details" text that appears at the end of some cells
def clean_text(text):
    if not text:
        return text
    
    text = str(text).strip()
    
    # check if it ends with "Course Details" and remove it
    if text.lower().endswith("course details"):
        text = text[:-14].strip()  # 14 is length of "Course Details"
    
    # also check for common separators before "Course Details"
    endings_to_remove = [" - Course Details", " — Course Details",  " – Course Details", ": Course Details", "| Course Details", ", Course Details",]
    
    for ending in endings_to_remove:
        if text.lower().endswith(ending.lower()):
            text = text[:-len(ending)].strip()
            break
    
    return text


# converts the table data into a simple list of dictionaries
def convert_table_to_list(df):
    if df is None or df.empty:
        return []
    
    # find which columns have our data
    course_col, credits_col, transfers_col = find_columns(df)
    
    results = []
    
    # go through each row in the table
    for index, row in df.iterrows():
        # course name
        if course_col:
            course = str(row.get(course_col, "")).strip()
        else:
            course = ""
        
        # credits
        if credits_col:
            credits_raw = row.get(credits_col, None)
        else:
            credits_raw = None
        
        # what it transfers as
        if transfers_col:
            transfers_as = str(row.get(transfers_col, "")).strip()
        else:
            transfers_as = ""
    
        course = clean_text(course)
        transfers_as = clean_text(transfers_as)
        
        # convert credits to a number
        credits = None
        if credits_raw is not None and pd.notna(credits_raw):
            try:
                credits = float(str(credits_raw).strip().split()[0])
            except:
                credits = None
        
        # skip rows that look like section headers
        if course.lower().startswith("fall "):
            continue
        if course.lower().endswith("effective"):
            continue
        
        # add to results if we have data
        if course or transfers_as:
            results.append({
                "course": course,
                "credits": credits,
                "transfersAs": transfers_as,
            })
    
    return results


# JSON response back to the browser
def send_response(handler, status_code, data):
    handler.send_response(status_code)
    handler.send_header('Content-Type', 'application/json')
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type')
    handler.end_headers()
    handler.wfile.write(json.dumps(data).encode())


# handler that Vercel uses
class handler(BaseHTTPRequestHandler):
    
    # OPTIONS requests
    def do_OPTIONS(self):
        send_response(self, 200, {})
    
    # POST requests
    def do_POST(self):
        # read the request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        # parse the JSON data
        try:
            data = json.loads(body) if body else {}
        except:
            data = {}
        
        # search parameters from the request
        school_id = data.get("formerSchool")
        umbc_prefix = data.get("umbcPrefix", "")
        year = data.get("year")
        old_school_class = data.get("oldSchoolClass", "")
        
        # check if school_id was provided
        if not school_id:
            send_response(self, 400, {"error": "formerSchool is required"})
            return
        
        # check if at least one class filter was provided
        if not umbc_prefix and not old_school_class:
            send_response(self, 400, {"error": "Please provide umbcPrefix or oldSchoolClass"})
            return
        
        # try to get the transfer data
        try:
            # get the table from the website
            table = get_transfer_courses(
                school_id=school_id,
                year=year,
                old_class=old_school_class or "",
                umbc_class=umbc_prefix or "",
            )
            rows = convert_table_to_list(table)
            
            # send back the results
            send_response(self, 200, {"rows": rows, "source": "python"})
            
        except Exception as e:
            # send an error if sm was wrong
            send_response(self, 500, {"error": str(e)})