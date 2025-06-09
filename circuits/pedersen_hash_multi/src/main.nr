use std::hash::pedersen_hash;

// Circuit to compute Pedersen hashes for various input sizes
// This matches exactly what the account system circuit uses

fn main(
    inputs: [Field; 4],
    input_count: u32
) -> pub Field {
    if input_count == 1 {
        pedersen_hash([inputs[0]])
    } else if input_count == 2 {
        pedersen_hash([inputs[0], inputs[1]])
    } else if input_count == 3 {
        pedersen_hash([inputs[0], inputs[1], inputs[2]])
    } else if input_count == 4 {
        pedersen_hash([inputs[0], inputs[1], inputs[2], inputs[3]])
    } else {
        0 // Invalid input count
    }
}

#[test]
fn test_single_input() {
    let inputs = [12345, 0, 0, 0];
    let result = main(inputs, 1);
    let expected = pedersen_hash([12345]);
    assert(result == expected);
}

#[test]
fn test_dual_input() {
    let inputs = [123, 456, 0, 0];
    let result = main(inputs, 2);
    let expected = pedersen_hash([123, 456]);
    assert(result == expected);
}

#[test]
fn test_quad_input() {
    let inputs = [100, 200, 300, 400];
    let result = main(inputs, 4);
    let expected = pedersen_hash([100, 200, 300, 400]);
    assert(result == expected);
}