import API from "../api/axios";

// dashboard summary
export const getSummary         = ()                     => API.get("/reports/summary").then(r => r.data);

// books
export const addBooks           = (data)                 => API.post("/books", data).then(r => r.data);
export const getAllBooks        = (page = 1, limit = 10) => API.get(`/books?page=${page}&limit=${limit}`).then(r => r.data);
export const searchBooks        = (query, page = 1)      => API.get(`/books/search?query=${query}&page=${page}`).then(r => r.data);
export const updateBook         = (bookId, data)         => API.put(`/books/${bookId}`, data).then(r => r.data);
export const deleteBook         = (bookId)               => API.delete(`/books/${bookId}`).then(r => r.data);

// users / members
export const getAllMembers      = (page = 1)             => API.get(`/users?page=${page}`).then(r => r.data);
export const getMemberById      = (userId)               => API.get(`/users/${userId}`).then(r => r.data);
export const blockMember        = (userId)               => API.patch(`/users/${userId}/block`).then(r => r.data);
export const clearMemberFine    = (userId)               => API.patch(`/users/${userId}/fine`).then(r => r.data);
export const deleteMember       = (userId)               => API.delete(`/users/${userId}`).then(r => r.data);

// issuances
export const getAllIssuances     = (page = 1, status)    => API.get(`/issues?page=${page}${status ? `&status=${status}` : ""}`).then(r => r.data);
export const getOverdueIssuances = ()                    => API.get("/issues?status=overdue").then(r => r.data);
export const issueBook           = (bookId, userId)      => API.post("/issues", { bookId, userId }).then(r => r.data);
export const returnBook          = (issueId)             => API.patch(`/issues/${issueId}/return`).then(r => r.data);

// fines
export const getAllFines         = (status, page = 1)    => API.get(`/fines?${status ? `status=${status}&` : ""}page=${page}`).then(r => r.data);
export const payFine             = (fineId, amount)      => API.patch(`/fines/${fineId}/pay`, { amount }).then(r => r.data);
export const waiveFine           = (fineId, reason)      => API.patch(`/fines/${fineId}/waive`, { reason }).then(r => r.data);