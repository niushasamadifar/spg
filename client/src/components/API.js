const URL = "http://localhost:3000"

async function loadProducts() {
    let myURL = URL + "/api/products";
    const response = await fetch(myURL);
    if (response.ok) {
        const fetchedProducts = await response.json();
        return fetchedProducts;
    } else return { 'error': 'Failed to load Products from server' }
}

async function loadClients() {
    let myURL = URL + "/api/clients";
    const response = await fetch(myURL);
    if (response.ok) {
        const fetchedClients = await response.json();
        return fetchedClients;
    } else return { 'error': 'Failed to load clients from server' }
}

async function loadOrders() {
    let myURL = URL + "/api/getorders";
    const response = await fetch(myURL);
    if (response.ok) {
        const fetchedOrders = await response.json();
        return fetchedOrders;
    } else return { 'error': 'Failed to load Orders from server' }
}

async function loadClient(id) {
    let myURL = URL + "/api/clients/" + id;
    const response = await fetch(myURL);
    if (response.ok) {
        const fetchedClient = await response.json();
        return fetchedClient;
    } else return { 'error': 'Failed to load client from server' }
}

async function sendOrder(order) {
    const response = await fetch(URL + "/api/orders/",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(order),
        });
    if (response.ok) {
        return true;
    } else return { 'error': 'Failed to store data on server' }
}

async function updateOrder(id) {
    const response = await fetch(URL + `/api/updateOrder/${id}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            
        });
    if (response.ok) {
        return true;
    } else return { 'error': 'Failed to store data on server' }
}

async function login(user) {
    const response = await fetch(URL + "/api/sessions/",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        });
    if (response.ok) {
        return response.json();
    } else return { 'error': 'Failed to login: invalid username/password' }
}

async function logout() {
    const response = await fetch(URL + "/api/sessions/current/",
        {
            method: "DELETE"
        });
    if (response.ok) {
        return 1;
    } else return { 'error': 'Failed to logout' }
}

async function isLoggedIn() {
    try {
        const response = await fetch(URL + "/api/sessions/current/");
        if (response.ok) {
            return response.json();
        } else return { 'error': 'User is not logged in' };
    } catch (err) {
        return { 'error': 'User is not logged in' };
    }
}

const API = { loadProducts, loadClients, sendOrder, loadClient, login, logout, isLoggedIn,loadOrders,updateOrder };
export default API;