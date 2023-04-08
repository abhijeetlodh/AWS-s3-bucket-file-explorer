// JavaScript Code for S3 Bucket File Explorer

const appDiv = document.getElementById('app');

// Helper function for making API requests
async function makeRequest(method, url, body=null) {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.json();
  } catch (err) {
    console.error(err);
  }
}

// Function for rendering the directory listing on the page
function renderDirectoryList(data) {
  // Clear existing content
  appDiv.innerHTML = '';

  // Render breadcrumbs
  const breadcrumbs = document.createElement('ul');
  data.path.split('/').reduce((acc, item, i) => {
    const path = acc + item + '/';
    const li = document.createElement('li');
    li.innerHTML = `<a href="#" class="breadcrumb-link" data-path="${path}">${item}</a>`;
    breadcrumbs.appendChild(li);
    return path;
  }, '');
  appDiv.appendChild(breadcrumbs);

  // Render file and directory list
  const filesTable = document.createElement('table');
  filesTable.innerHTML = `
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Last Modified</th>
      <th>Actions</th>
    </tr>
  `;
  data.contents.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.type}</td>
      <td>${new Date(item.lastModified).toLocaleString()}</td>
      <td>
        <button class="btn btn-download" data-key="${item.key}">Download</button>
        <button class="btn btn-delete" data-key="${item.key}">Delete</button>
      </td>
    `;
    filesTable.appendChild(row);
  });
  appDiv.appendChild(filesTable);

  // Attach event listeners to breadcrumb links
  const breadcrumbLinks = Array.from(document.getElementsByClassName('breadcrumb-link'));
  breadcrumbLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const path = event.target.getAttribute('data-path');
      getDirectoryContents(path);
    });
  });

  // Attach event listeners to download buttons
  const downloadButtons = Array.from(document.getElementsByClassName('btn-download'));
  downloadButtons.forEach(button => {
    button.addEventListener('click', event => {
      const key = event.target.getAttribute('data-key');
      downloadFile(key);
    });
  });

  // Attach event listeners to delete buttons
  const deleteButtons = Array.from(document.getElementsByClassName('btn-delete'));
  deleteButtons.forEach(button => {
    button.addEventListener('click', event => {
      const key = event.target.getAttribute('data-key');
      deleteFile(key);
    });
  });
}

// Function for getting the contents of a directory within the S3 bucket
async function getDirectoryContents(path='') {
  const url = `/api/directory?path=${encodeURIComponent(path)}`;
  const data = await makeRequest('GET', url);
  renderDirectoryList(data);
}

// Function for uploading a file to the S3 bucket
async function uploadFile(file) {
  const url = '/api/file';
  const formData = new FormData();
  formData.append('file', file);
  try {
    await makeRequest('POST', url, formData);
    getDirectoryContents();
  } catch (err) {
    console.error(err);
    alert(`Error uploading file: ${err.message}`);
  }
}

// Function for downloading a file from the S3 bucket
async function downloadFile(key='') {
  const url = `/api/file?key=${encodeURIComponent(key)}`;
  window.open(url, '_blank');
}

// Function for deleting a file from the S3 bucket
async function deleteFile(key='') {
  try {
    const confirmed = confirm(`Are you sure you want to delete the file '${key}'?`);
    if (confirmed) {
      const url = `/api/file?key=${encodeURIComponent(key)}`;
      await makeRequest('DELETE', url);
      getDirectoryContents();
    }
  } catch (err) {
    console.error(err);
    alert(`Error deleting file: ${err.message}`);
  }
}

// Event listener for form submission
const uploadForm = document.getElementById('upload-form');
uploadForm.addEventListener('submit', event => {
  event.preventDefault();
  const fileInput = document.getElementById('file-input');
  const files = fileInput.files;
  if (files.length > 0) {
    uploadFile(files[0]);
  }
});

// Initial page load
getDirectoryContents();
