Garaga version 0.17.0 just released. /!\ To anyone working with Noir, please pay attention. /!\

Barretenberg 0.85.0 came out and it fixes a critical issue for ZK flavours, which in result was critical for all flavours verifiers.

Garaga Noir verifiers used to accept proof points to be either the point at infinity, or on curve. 
This is also the behavior of the current solidity verifiers, which I believe are not safe. 
This is not part of the plonk protocol and every point should be strictly on curve.

When I tried rejecting those points I realized one of the proof points for ZKFlavours was the point at infinity and saw that a few days before, some guy from TACEO found the same issue : https://github.com/AztecProtocol/aztec-packages/issues/13116 

Finally the fix has been merged to barretenberg and now garaga generated verifiers assert all points are strictly on curve.

The new supported Noir versions are bb 0.85.0 and noir 1.0.0-beta3

On top of that, many performance improvement have been made, both on calldata size and steps for Noir proofs, as well as calldata generation time in rust. 

Upgrading is highly recommended and any honk contract generated with garaga versions before 0.17.0 should be considered insecure for Noir proofs. 

Thank you.

----

garga requires python 3.10 < 3.11

---











