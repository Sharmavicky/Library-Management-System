import API from "../api/axios";

export const getMyProfile = async () => API.get("/member/profile").then(r => r.data);

export const getMyIssuedBooks = async (page=1) => API.get(`/issues/my?page=${page}`).then(r => r.data);

export const getMyFines = async (status, page=1) => API.get(`/fines?${status ? `status=${status}&` : ""}page=${page}`).then(r => r.data);

export const getAllBooks = async (page=1, limit=10) => API.get(`/books?page=${page}&limit=${limit}`).then(r => r.data);

export const searchBooks = async (query, page=1) => API.get(`/books/search?query=${query}&page=${page}`).then(r => r.data);

export const requestBook = async (bookId) => API.post(`/books/${bookId}/request`).then(r => r.data);

export const getReadAccess = async (issueId) => API.get(`/issues/read/${issueId}`).then(r => r.data);
export const fetchBookText = async (url) => API.get(`/books/proxy-text?url=${encodeURIComponent(url)}`).then(r => r.data);