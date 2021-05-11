exports.serializer=(val)=> {
    return JSON.stringify(val);
}

exports.deserializer =(val)=> {
    let result;
    try {
        result = JSON.parse(val);
        return result;
    } catch (error) {
        throw new Error('反序列化时出现错误' + error);
    }
}