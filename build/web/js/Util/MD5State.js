function MD5State() {
    
    var state;
    var count;
    var buffer;
    
    buffer = new Array();
    count = 0;
    state = new Array();
    
    state[0] = 0x67452301;
    state[1] = 0xefcdab89;
    state[2] = 0x98badcfe;
    state[3] = 0x10325476;
}

function MD5State( from ) {
    
    var state;
    var count;
    var buffer;
    
    buffer = new Array();
    count = 0;
    state = new Array();
    
    state[0] = 0x67452301;
    state[1] = 0xefcdab89;
    state[2] = 0x98badcfe;
    state[3] = 0x10325476;
    
    var i;
    
    for (i = 0; i < buffer.length; i++)
      buffer[i] = from.buffer[i];
    
    for (i = 0; i < state.length; i++)
      state[i] = from.state[i];
    
    count = from.count;
}