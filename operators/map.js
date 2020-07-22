
import Stream from "../stream";
import Edge from "../edge";
import Args from "../args";

export default function()
{
    const args = Args( "map", arguments, { maxTargets : 0, needF : true } );
    
    const operator = {
        apply,
        f : args.f
    };
    operator.destructor = () => delete operator.f;
    
    const r = new Stream( args.source._name + ".map" );
    new Edge(
        args.source,
        r,
        operator
    );
    return r;
}

function apply( edge )
{
    edge.child.value = edge.operator.f( edge.parent.value );
    return true;
}

