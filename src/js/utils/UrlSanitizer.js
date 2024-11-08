const UrlSanitizer = urltxt => {
  try {
    // Return early if the URL text is empty or whitespace
    if (!urltxt || urltxt.trim() === '') {
      return '';
    }

    urltxt = urltxt.trim();

    // Add https:// if https or www is missing
    if (!/^https:\/\/(?!www\.)/.test(urltxt)) {
      urltxt = `https://${  urltxt.replace(/^(?:https?:\/\/)?(?:www\.)?/, '')}`;
    }

    // console.log(urltxt);

    // Updated URL validation pattern to allow https:// without requiring www.
    const pattern = new RegExp(
      '^' +
        '(https:\\/\\/)' + // requires https://
        '((?!www\\.)[a-zA-Z0-9-]+\\.)*' + // optional subdomains, excluding www
        '[a-zA-Z0-9-]{2,}\\.' + // main domain
        '[a-zA-Z]{2,}' + // top-level domain (e.g., .com, .dk)
        '(?::\\d+)?' + // port (optional)
        '(?:\\/[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)?' + // path (optional)
        '(?:#[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)?' + // fragment/hash (optional)
        '$'
    );

    const result = pattern.test(urltxt);

    if (result) {
      //console.log('url is valid');
      return new URL(urltxt);
    } else {
      // console.log('url is invalid');
      //console.log(result, urltxt);
      return '';
    }
  } catch (error) {
    // If URL is invalid, return an empty string
    return `error: ${  error}`;
  }
};

export default UrlSanitizer;
