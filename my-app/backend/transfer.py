import requests
from lxml import html
import pandas as pd
from datetime import datetime
import argparse
import json
import sys

def fetch_transfer_equivalencies(former_school, year, old_school_class, UMBC_class):
    # Using the artsys website, i reverse-enginnered the process to request the data to allow us to make a makeshift
    # api since they don't have one
    # former_school -> the teaching university ID (ex. 5209 for CCBC)
    # year -> current year needed for api call
    # old_school_class -> the class prefix from the old school (ex. 'MATH')
    # UMBC_class -> the target UMBC class prefix (ex. 'CMSC')

    # default year is the current year
    if year is None:
        year = datetime.now().year

    # build the URL so we can fill in the fields
    base_url = "https://articulation.usmd.edu/equivalencies"
    params = {
        "q[filter_by]": "",
        "q[teaching_university_id_eq]": former_school,
        "q[home_university_id_eq]": 12645, # -> UMBC's code and since we only care about UMBC, we can keep it static
        "q[effective_in_terms_range]": f"2018,fall-{year+1},spring",
        "q[teaching_courses_name_or_teaching_courses_code_cont]": old_school_class,
        "q[home_courses_name_or_gen_ed_cont]": UMBC_class,
        "q[transfer_type_in][]": ["course_transfer", "gen_ed_transfer", "non_transfer_university"],
        "page_size": 100,
    }
    # we have to use custom headers since they have some fingerprinting technique for bot scrapes
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/140.0.0"
    }

    # make the request + parse it
    response = requests.get(base_url, params=params, headers=headers)
    response.raise_for_status()
    tree = html.fromstring(response.content)

    # find table element
    table_element = tree.xpath('//*[@id="equivalencies-table"]')
    if not table_element:
        raise ValueError("No table found with id 'equivalencies-table'")

    # and then convert to DataFrame
    table_html = html.tostring(table_element[0], encoding="unicode")
    df = pd.read_html(table_html)[0]
    return df

'''
Former School IDs (had to find this manually lol)
1725 = Allegany College of Maryland
1726 = Anne Arundel Community College
1730 = Baltimore City Community College
4839 = Carroll Community College
1736 = Cecil College
1738 = Chesapeake College
1737 = College of Southern Maryland
5209 = Community College of Baltimore County
1743 = Frederick Community College
1745 = Garrett College
1749 = Hagerstown Community College
1750 = Harford Community College
1752 = Howard Community College
1768 = Montgomery College
10259 = Prince George's Community College
1792 = Wor-Wic Community College
'''

def _normalize_columns(df: pd.DataFrame):
    # lowercase+strip column names for  matching
    normalized = {str(c).strip().lower(): c for c in df.columns}
    # getting names for required fields
    course_col = next((normalized[k] for k in normalized if "course" in k and "transfer" not in k), None)
    credits_col = next((normalized[k] for k in normalized if "credit" in k), None)
    transfers_col = None
    for k in normalized:
        if "transfer" in k and ("as" in k or "umbc" in k or "home" in k):
            transfers_col = normalized[k]
            break
    #if transfers not found, try the last column
    if transfers_col is None and len(df.columns) >= 3:
        transfers_col = df.columns[-1]
    return course_col, credits_col, transfers_col


# more parsing...
def _to_rows(df: pd.DataFrame):
    if df is None or df.empty:
        return []
    course_col, credits_col, transfers_col = _normalize_columns(df)
    rows = []
    for _, row in df.iterrows():
        course = str(row.get(course_col, "")).strip() if course_col else ""
        credits_raw = row.get(credits_col, None) if credits_col else None
        transfers_as = str(row.get(transfers_col, "")).strip() if transfers_col else ""

        # parse credits to float if possible
        credits = None
        if pd.notna(credits_raw):
            try:
                # some tables show credits like "3.00" or "3" so we have to handle that
                credits = float(str(credits_raw).strip().split()[0])
            except Exception:
                credits = None

        # skip obvious section headers
        if course.lower().startswith("fall ") or course.lower().endswith("effective"):
            continue

        if course or transfers_as:
            rows.append({
                "course": course,
                "credits": credits,
                "transfersAs": transfers_as,
            })
    return rows


def main():
    parser = argparse.ArgumentParser(description="Fetch transfer equivalencies and output JSON")
    parser.add_argument("--former-school", type=int, required=True)
    parser.add_argument("--year", type=int, default=None)
    parser.add_argument("--old-school-class", type=str, default="")
    parser.add_argument("--umbc-class", type=str, default="")
    args = parser.parse_args()

    try:
        df = fetch_transfer_equivalencies(
            former_school=args.former_school,
            year=args.year,
            old_school_class=args.old_school_class or "",
            UMBC_class=args.umbc_class or "",
        )
        rows = _to_rows(df)
        json.dump({"rows": rows}, sys.stdout)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()