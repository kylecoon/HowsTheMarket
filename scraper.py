import csv
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException, TimeoutException

jobs_container_class = "nXRyPhaRhFcRJJqJrUcAKHMiRAaeMsefCI\n          \n          "

total_pages = 0

s = Service("/usr/local/bin/chromedriver")

driver = webdriver.Chrome(service = s)

driver.implicitly_wait(1.5)

# Navigate to LinkedIn login page
driver.get("https://www.linkedin.com/login")

# Find and fill the email (username) and password fields
# email = driver.find_element(By.ID, "username")
# email.send_keys("kylejcoon@gmail.com")

# password = driver.find_element(By.ID, "password")
# password.send_keys("Kylec1213") 
# password.send_keys(Keys.RETURN)

# Wait for login to complete
time.sleep(15)

#Navigate to job search page
driver.get("https://www.linkedin.com/jobs/search/?currentJobId=3932350478&f_E=1%2C2%2C3&f_JT=F%2CP%2CC%2CI%2CO&f_TPR=r86400&f_VJ=true&keywords=software%20engineer&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&sortBy=R&spellCorrectionEnabled=true")

# Locate the job postings container
job_postings_container = driver.find_element(By.XPATH, '/html/body/div[6]/div[3]/div[4]/div/div/main/div/div[2]/div[1]/div')

def collect_job_by_xpath(xpath):
    try:
        # Locate the job element using XPath
        job_element = driver.find_element(By.XPATH, xpath)

        # Extract the job title
        try:
            job_title = job_element.find_element(By.CSS_SELECTOR, 'div.artdeco-entity-lockup__title').text.split("\n")[0]
        except:
            job_title = "NA"

        # Extract the company name
        try:
            company_name = job_element.find_element(By.CSS_SELECTOR, 'div.artdeco-entity-lockup__subtitle').text
        except:
            company_name = "NA"

        # Extract the location
        try:
            location = job_element.find_element(By.CSS_SELECTOR, 'div.artdeco-entity-lockup__caption').text
            state = parse_location(location)
            office_type = parse_office_type(location)
        except:
            location = "NA"
            state = "NA"
            office_type = "NA"

        # Extract the salary
        try:
            salary_string = job_element.find_element(By.CSS_SELECTOR, 'div.mt1.t-sans.t-12.t-black--light.t-normal.t-roman.artdeco-entity-lockup__metadata').text
            salary = calculate_salary(salary_string)
        except:
            salary = "NA"

        return {
            "job_title": job_title,
            "company_name": company_name,
            #"location": location,
            "office_type": office_type,
            "state": state,
            "salary": salary,
            #"date_posted": date_posted
        }

    except Exception as e:
        print(f"Error collecting job data: {e}")
        return None

def scroll_and_collect(driver, job_postings_container):
    """
    Scroll down the job postings container, collect job listings, and repeat the process until no new listings appear.
    """
    all_listings_collected = []

    job_index = 1

    skipped_jobs = 0
    added_jobs = 0

    while True:
        # Construct XPath for the current job
        xpath = f"/html/body/div[6]/div[3]/div[4]/div/div/main/div/div[2]/div[1]/div/ul/li[{job_index}]"
        
        # Try to collect the job at the current XPath
        job_data = collect_job_by_xpath(xpath)


        time.sleep(0.1)
        
        if job_data:
            print("Job #", job_index, ":", job_data['job_title'], "@", job_data['company_name'])
            if (job_data['company_name'] != "Epic" and job_data['company_name'] != "Varsity Tutors, a Nerdy Company") or (job_data['company_name'] == "Epic" and job_data['state'] == "WI") or (job_data['company_name'] == "Epic" and job_data['state'] == "WI"):
                all_listings_collected.append(job_data)
                added_jobs += 1
            else:
                skipped_jobs += 1
                print("skipped job:")
                print(job_data)
        
        else:
            print(f"Reached the end or job {job_index} does not exist.")
            break

        driver.execute_script("arguments[0].scrollBy(0, 130);", job_postings_container)

        job_index += 1

        time.sleep(0.1)

    print("added ", added_jobs, " jobs")
    print("skipped ", skipped_jobs, " jobs")
    if added_jobs != len(all_listings_collected):
        print("!!!ERROR!!!")
        print("all_listings_collected size = ", len(all_listings_collected))
        print("added_jobs = ", added_jobs)
    return all_listings_collected

def go_to_page(driver, page_number):
    """
    Navigate to the specified page number in the pagination.
    Returns True if successful, False otherwise.
    """
    try:
        page_button = driver.find_element(By.CSS_SELECTOR, f'li[data-test-pagination-page-btn="{page_number}"] button')

        page_button.click()
        time.sleep(1)  # Wait for the page to load
        return True
    except NoSuchElementException:
        return False
    
def scrape_all_pages_with_numbered_pagination(driver, job_postings_container):
    """
    Scrape all job listings across multiple pages with numbered pagination.
    """
    all_jobs = []
    current_page = 1

    while True:
        print(f"Scraping page {current_page}...")

        jobs_on_page = scroll_and_collect(driver, job_postings_container)
        
        for job in jobs_on_page:
            if job not in all_jobs:
                all_jobs.append(job)

        current_page += 1

        if current_page == 9:
            try:
                ellipsis_button = driver.find_element(By.XPATH, "//button[@aria-label='Page 9']")
                ellipsis_button.click()
            except NoSuchElementException:
                print("No more pages to scrape.")
                break
            
        elif not go_to_page(driver, current_page):
            print("No more pages to scrape.")
            break

    return all_jobs

def calculate_salary(salary):
    if "yr" in salary:
        return salary.split("$")[1].split("K")[0]

    elif "hr" in salary:
        return str((float(salary.split("$")[1].split("/")[0]) * 40 * 50 ) / 1000 )
    else:
        return "NA"
    
def parse_location(location):
    state = location.split(",")[1].split(" ")[1]
    if len(state) != 2:
        return "NA"
    else:
        return state
def parse_office_type(location):
    office_type = location.split("(")[1].split(")")[0]
    if len(office_type) == 0:
        return "NA"
    if office_type[0] != 'H' and office_type[0] != 'O' and office_type[0] != 'R':
        return "NA"
    return office_type

job_postings_container = driver.find_element(By.XPATH, '/html/body/div[6]/div[3]/div[4]/div/div/main/div/div[2]/div[1]/div')
all_jobs = scrape_all_pages_with_numbered_pagination(driver, job_postings_container)

data_directory = "/Users/kylecoon/Desktop/HowsTheMarket/src/data/"

filenames = os.listdir(data_directory)

file_index = "0"
if len(filenames) > 0:
    file_index = str(len(filenames))

csv_file_path = data_directory + "/" + file_index + ".csv"

with open(csv_file_path, mode="w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=["job_title", "company_name", "state", "office_type", "salary"])
    writer.writeheader()
    writer.writerows(all_jobs)

driver.quit()
