const paginate = async (model, query = {}, options = {}, populateOptions = [], sort = { createdAt: -1 }) => {
    // parse page and limit from query parameters
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(50, parseInt(options.limit) || 10);
    const skip = (page - 1) * limit;

    // run data query and count query in parallel to optimize performance
    let dataQuery = model.find(query).skip(skip).limit(limit).sort(sort);

    // apply all populate options
    for (const pop of populateOptions) {
        dataQuery = dataQuery.populate(pop);
    }

    const [data, total] = await Promise.all([
        dataQuery,
        model.countDocuments(query) // total count of documents matching the query 
    ])

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages
        }
    }
};

module.exports = paginate;