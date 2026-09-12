const getPagination = (page = 1, limit = 10) => {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    return {
        page: pageNumber,
        limit: limitNumber,
        skip,
    };
};

const formatPaginationResponse = (totalItems, page, limit) => {
    return {
        page: Number(page),
        limit: Number(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
    };
};

module.exports = {
    getPagination,
    formatPaginationResponse,
};
