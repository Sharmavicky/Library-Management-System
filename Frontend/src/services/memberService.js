import API from "../api/axios";

export const getMyProfile = async () => {
    const { data } = await API.get("/users/profile");
    return data;
}

export const getMyIssues = async () => {
    const { data } = await API.get("/issues/my");
    return data;
}

export const getAllBooks = async (page=1, limit=10, search="", shelf="") => {
    const { data } = await API.get("/books", {
        params: { page, limit, search, shelf}
    });
    return data;
}